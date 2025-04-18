const puppeteer = require("puppeteer");

let launchOptions;

async function getLaunchOptions() {
  return {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
}
async function verifyNgo(ngoName, regno) {
  let browser;
  try {
    // 💡 Get dynamic launch options
    if (!launchOptions) {
      launchOptions = await getLaunchOptions();
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // 1) Go to NGO Darpan
    await page.goto("https://ngodarpan.gov.in/#/search-ngo", {
      waitUntil: "networkidle2",
    });

    // 2) Type NGO name
    await page.waitForSelector("#username", { timeout: 15000 });
    await page.type("#username", ngoName.toUpperCase());

    // 3) Click Search
    await page.waitForSelector("button.primary-btn.filled-btn", { timeout: 15000 });
    await page.click("button.primary-btn.filled-btn");

    // 4) Wait for results
    await page.waitForSelector("tbody.p-datatable-tbody tr", { timeout: 15000 });

    // 5) Extract name, reg no, address
    const { fetchedNgoName, fetchedRegNo, fetchedAddress } = await page.evaluate(() => {
      const row = document.querySelector("tbody.p-datatable-tbody tr");
      if (!row) {
        return { fetchedNgoName: null, fetchedRegNo: null, fetchedAddress: null };
      }

      const columns = row.querySelectorAll("td");
      if (columns.length < 4) {
        return { fetchedNgoName: null, fetchedRegNo: null, fetchedAddress: null };
      }

      const rawNgoName = columns[1].innerText.trim().toUpperCase();
      const rawRegInfo = columns[2].innerText.trim().toUpperCase();
      const rawAddress = columns[3].innerText.trim();

      return {
        fetchedNgoName: rawNgoName,
        fetchedRegNo: rawRegInfo,
        fetchedAddress: rawAddress,
      };
    });

    await browser.close();

    if (fetchedNgoName !== ngoName.toUpperCase()) {
      return { isVerified: false, fetchedAddress: null };
    }

    const isVerified = fetchedRegNo.includes(regno.toUpperCase());
    return { isVerified, fetchedAddress };
  } catch (error) {
    console.error("Error during Puppeteer verification:", error);
    if (browser) await browser.close();
    throw error;
  }
}

module.exports = { verifyNgo };

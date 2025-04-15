const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const donorModel = require("../models/Donor");

const browserPaths = {
    edge: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    linux: "/usr/bin/google-chrome",
    mac: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
};

puppeteer.use(StealthPlugin());

const router = express.Router();
let browserInstance;

function getAvailableBrowser() {
    const fs = require("fs");
    if (fs.existsSync(browserPaths.edge)) return browserPaths.edge;
    if (fs.existsSync(browserPaths.chrome)) return browserPaths.chrome;
    return null;
}


router.post("/start-fssai-verification", async (req, res) => {
    const userEmail = req.session?.Donor?.email;

    if (!userEmail) {
        return res.status(400).json({ valid: false, message: "User session required." });
    }

    if (browserInstance) {
        await browserInstance.close();
    }

    const browserExecutable = getAvailableBrowser();
    if (!browserExecutable) {
        console.log("⚠️ No Edge/Chrome found. Using default Puppeteer Chromium.");
    }

    try {
        browserInstance = await puppeteer.launch({
            executablePath: browserExecutable || undefined,
            headless: false,
            args: ["--new-window", "--disable-gpu", "--no-sandbox"]
        });
    } catch (launchErr) {
        console.error("❌ Browser Launch Error:", launchErr);
        return res.status(500).json({ error: "Could not launch browser" });
    }

    const page = await browserInstance.newPage();
    // Set default timeouts to 10 minutes (600000 ms)
    await page.setDefaultNavigationTimeout(600000);
    await page.setDefaultTimeout(600000);
    try {
        console.log("✅ Opening FSSAI Website...");
        await page.goto("https://foscos.fssai.gov.in/", { waitUntil: "networkidle0", timeout: 600000 }); // Timeout set to 5 minutes

        console.log("✅ Expanding 'FBO Search' Section...");
        await page.waitForSelector("a#governmentAgencies1", { visible: true, timeout: 15000 });
        await page.evaluate(() => document.querySelector("a#governmentAgencies1").click());
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log("⌛ Waiting for user to enter license & CAPTCHA...");

        try {
            await page.waitForFunction(() => {
                const cells = document.querySelectorAll("#data-table-simple td");
                return cells.length > 3 && cells[2].innerText.trim() !== "" && cells[3].innerText.trim() !== "";
            }, { timeout: 120000 }); // Wait until table has complete data
        } catch (error) {
            console.log("❌ No results found. CAPTCHA or license input might have failed.");
            if (browserInstance) await browserInstance.close();
            return res.json({ valid: false, message: "No records found for this FSSAI number. Try again after solving CAPTCHA." });
        }

        console.log("✅ Extracting FSSAI Data...");
        let extractedData = await page.evaluate(() => {
            const rows = document.querySelectorAll("#data-table-simple tr"); // Select table rows
            if (!rows.length) return { status: "No data found", address: "Address Not Found", regno: "Reg No Not Found" };

            let extracted = { status: "No data found", address: "Address Not Found", regno: "Reg No Not Found" };

            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll("td")).map(td => td.textContent.trim()); // ✅ Use textContent.trim()

                if (cells.length > 3) {
                    extracted.status = cells.find(text => text.includes("Active")) || extracted.status;
                    extracted.address = cells[2] || extracted.address; // ✅ Extracting Address (Index 2)
                    extracted.regno = cells[3].replace(/\s+/g, '') || extracted.regno; // ✅ Extracting Reg No (Trimmed)
                }
            });

            return extracted;
        });

        console.log("🔍 Extracted FSSAI Data:", extractedData);

        // ✅ Retry Extraction if Data is Incomplete
        if (!extractedData.address.includes(" ") || !extractedData.regno.includes(" ")) {
            console.log("⚠️ Data is incomplete, retrying extraction...");
            await new Promise(resolve => setTimeout(resolve, 5000));

            const retryData = await page.evaluate(() => {
                const cells = Array.from(document.querySelectorAll("#data-table-simple td")).map(td => td.innerText.trim());

                return {
                    status: cells.find(text => text.includes("Active")) || "No data found",
                    address: cells.length > 2 ? cells[2] : "Address Not Found",
                    regno: cells.length > 3 ? cells[3] : "Reg No Not Found"
                };
            });

            console.log("🔄 Retried FSSAI Data Extraction:", retryData);
            extractedData = retryData;
        }

        // ✅ Update MongoDB Donor collection with verified, regno, and address
        await donorModel.updateOne(
            { email: userEmail },
            {
                $set: {
                    verified: extractedData.status.includes("Active"),
                    regno: extractedData.regno,
                    address: extractedData.address
                }
            }
        ).then(result => {
            console.log(`✅ Database Updated: ${userEmail} | Verified: ${extractedData.status.includes("Active")} | RegNo: ${extractedData.regno} | Address: ${extractedData.address}`);
        }).catch(err => {
            console.error("❌ Database Update Error:", err);
            return res.status(500).json({ error: "Database update failed" });
        });

        // ✅ Close Puppeteer Only After All Data is Processed
        if (extractedData.address !== "Address Not Found" && extractedData.regno !== "Reg No Not Found") {
            if (browserInstance) {
                await browserInstance.close();
                browserInstance = null;
                console.log("✅ Puppeteer Closed.");
            }
        } else {
            console.log("⚠️ Puppeteer remains open for manual check.");
        }

        // ✅ Send Response
        res.json({ valid: extractedData.status.includes("Active"), regno: extractedData.regno, address: extractedData.address });

    } catch (error) {
        console.error("❌ Puppeteer Error:", error);
        if (browserInstance) {
            await browserInstance.close();
            browserInstance = null;
        }
        return res.status(500).json({ error: "Failed to complete FSSAI verification" });
    }
});

module.exports = router;

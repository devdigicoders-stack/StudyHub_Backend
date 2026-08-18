const express = require("express");
const axios = require("axios");
const qs = require("qs");

const router = express.Router();

// Helper Function: BTEUP Exam Portal se Result Fetch karne ke liye
const fetchBteupResult = async (enroll, dob, targetUrl) => {
  const urlToFetch =
    targetUrl || "http://result.bteexam.com/even/main/rollno.aspx";

  const normalizeDob = (date) => {
    if (!date) return "";
    if (date.includes("/")) return date;
    const [y, m, d] = date.split("-");
    if (!y || !m || !d) return "";
    return `${d}/${m}/${y}`;
  };

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    Origin: "http://result.bteexam.com",
    Referer: urlToFetch,
  };

  const postData = qs.stringify({
    txtRollNo: enroll,
    txtDob: normalizeDob(dob),
    btnSubmit: "Submit",
  });

  const response = await axios.post(urlToFetch, postData, {
    headers,
    timeout: 15000,
  });

  return response.data;
};

// Route 1: Official Result Route -> Endpoint banega `/api/bteup/official-result`
router.post("/official-result", async (req, res) => {
  try {
    const { enroll, dob, rawDob, targetUrl } = req.body;
    const normalizedDob = rawDob || dob;

    if (!enroll || !normalizedDob) {
      return res.status(400).json({
        message: "Enrollment number aur DOB dono zaroori hain.",
      });
    }

    const bteupUrl =
      targetUrl || "http://result.bteexam.com/even/main/rollno.aspx";
    const rawHtml = await fetchBteupResult(enroll, normalizedDob, bteupUrl);

    return res.status(200).json({
      success: true,
      html: rawHtml,
    });
  } catch (error) {
    console.error("Official BTEUP API Error:", error.message);
    return res.status(500).json({
      message:
        "BTEUP server respond nahi kar raha. Kripya check karein ki Enrollment/DOB sahi hai ya portal down hai.",
    });
  }
});

// VERY IMPORTANT: Auto-router system ke liye export karna zaroori hai
module.exports = router;

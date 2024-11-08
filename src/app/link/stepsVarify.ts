import axios from "axios";
import dns from "dns";
import https from "https";

// Function to check DNS lookup for the hostname
const checkDNSLookup = async (
  hostname: string
): Promise<{ status: "error" | "success"; error?: string }> => {
  return new Promise((resolve) => {
    dns.resolve(hostname, "A", (err, addresses) => {
      if (err) {
        console.error(
          "DNS Lookup Error::------ line 12 step verification------",
          err
        );
        return resolve({
          status: "error",
          error: err.message || "DNS lookup failed",
        });
      }
      resolve({ status: "success" });
    });
  });
};

// Function to check HTTP status of a URL
const checkHTTPStatus = async (
  url: string
): Promise<{ status: "error" | "success"; error?: string }> => {
  try {
    const response = await axios.get(url, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    if (response.status >= 200 && response.status < 300) {
      return { status: "success" }; // HTTP request successful
    }
    return {
      status: "error",
      error: `Received status code: ${response.status}`,
    };
  } catch (err: any) {
    console.log(err)
    console.error(
      "HTTP Check Error::------ line 43 step verification------",
      err.message || "HTTP request failed"
    );
    return {
      status: "error",
      error: err.message || "HTTP request failed",
    };
  }
};

// Syntax validation for URL
const syntaxValidation = (url: string): "success" | { error: string } => {
  const urlRegex =
    /^(https?:\/\/)?([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(:[0-9]+)?(\/[a-zA-Z0-9-._~%!$&'()*+,;=:@/]*)?(\?[a-zA-Z0-9-._~%!$&'()*+,;=:@/?]*)?(#[a-zA-Z0-9-._~%!$&'()*+,;=:@/?]*)?$/;

  if (urlRegex.test(url)) {
    return "success";
  }
  return { error: "Invalid URL syntax" };
};

// DNS Lookup
const dnsLookup = async (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    const dnsResult = await checkDNSLookup(hostname);
    return dnsResult.status === "success"
      ? "success"
      : { error: dnsResult.error };
  } catch (error) {
    return { error: "Invalid URL format or DNS verification error" };
  }
};

// HTTP Check
const httpCheck = async (url: string) => {
  try {
    if (!url) return { error: "URL is undefined or empty" };
    const httpResult = await checkHTTPStatus(url);
    return httpResult.status === "success"
      ? "success"
      : { error: httpResult.error };
  } catch (error) {
    return { error: "HTTP request failed" };
  }
};

// Google Safe Browsing API key stored in environment variables
const API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;

const checkSpamStatus = async (
  url: string
): Promise<"success" | { error: string }> => {
  if (!url) return { error: "URL is undefined or empty" };

  const requestBody = {
    client: {
      clientId: process.env.GOOGLE_SAFE_BROWSING_CLIENT_ID,
      clientVersion: "1.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await axios.post(apiUrl, requestBody, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    if (response.data && response.data.matches) {
      return {
        error: "The URL is flagged as unsafe by Google Safe Browsing.",
      };
    }
    return "success"; // URL is safe
  } catch (error: any) {
    console.error(
      "Spam Check Error:------ line 122 step verification------",
      error
    );
    return {
      error: error.response?.data || "Failed to verify URL safety",
    };
  }
};

export const stepsVerification = async (
  step: "Syntax Validation" | "DNS Lookup" | "HTTP Check" | "Spam Check",
  url: string
): Promise<"process" | "success" | { error?: string }> => {
  try {
    switch (step) {
      case "Syntax Validation":
        return syntaxValidation(url);
      case "DNS Lookup":
        return await dnsLookup(url);
      case "HTTP Check":
        return await httpCheck(url);
      case "Spam Check":
        return await checkSpamStatus(url);
      default:
        return { error: "Invalid verification step." };
    }
  } catch (error) {
    console.error(`Error during ${step}:`, error);
    return { error: (error as any).message || "Unknown error during verification." };
  }
};

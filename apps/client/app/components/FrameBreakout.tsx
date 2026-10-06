"use client";

import { useEffect } from "react";

// After paying inside Pesapal's iframe, Pesapal redirects the *iframe* to our
// callback URL. This makes the return page replace the whole browser window
// instead of rendering a tiny page inside the payment frame.
const FrameBreakout = () => {
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.location.href;
      }
    } catch {
      // Cross-origin top window: nothing we can do, page just renders in frame.
    }
  }, []);

  return null;
};

export default FrameBreakout;

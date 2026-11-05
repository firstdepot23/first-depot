// ONE SWITCH for the pharmacy.
//
//   true  -> a "Coming soon" window covers the whole pharmacy section
//            (shop, upload and prescriptions pages). Everything underneath is
//            still there, just covered and not clickable.
//   false -> the pharmacy opens exactly as it was.
//
// This is a plain module (not a "use client" file) on purpose: the layout is a
// server component and needs the real true/false value.
export const PHARMACY_COMING_SOON = true;
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "hi" | "mr";

/** Supported languages. Order here is the order shown in the selector. */
export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

export const DEFAULT_LANG: Lang = "en";

type Dict = Record<string, string>;

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.inventory": "Inventory",
  "nav.addInventory": "Add Inventory",
  "nav.warehouses": "Warehouses",
  "nav.categories": "Categories",
  "nav.stockMovement": "Stock Movement",
  "nav.alerts": "Alerts",
  "nav.reports": "Reports & Analytics",
  "nav.security": "Security Center",
  "nav.settings": "Settings",
  "nav.profile": "User Profile",
  "nav.tutorial": "Tutorial",

  "brand.cropWarehouse": "Crop Warehouse",
  "brand.tagline": "Smart Crop Warehouse",

  "topbar.search": "Search inventory, crop or batch…",
  "topbar.currentWarehouse": "Current warehouse",
  "topbar.warehouse": "Warehouse",
  "topbar.notifications": "Notifications",
  "topbar.language": "Language",

  "sidebar.secureSession": "Secure session",
  "sidebar.roleEnforced": "Role-based access enforced. Signed in as {name}.",
  "sidebar.logOut": "Log out",

  "page.dashboard.welcome": "Welcome back, {name} 👋",

  "page.inventory.title": "Inventory",
  "page.inventory.subtitle": "{shown} of {total} batches shown",
  "page.addInventory.title": "Add Inventory",
  "page.addInventory.subtitle":
    "Scan an existing tag once, or enter details manually. Storage date & time are captured automatically.",
  "page.warehouses.title": "Warehouses",
  "page.warehouses.subtitle":
    "Storage facilities, sections and racks — tap a warehouse to explore.",
  "page.categories.title": "Categories",
  "page.categories.subtitle": "Stock grouped by crop category across your warehouses.",
  "page.stockMovement.title": "Stock Movement",
  "page.stockMovement.subtitle":
    "Record every change — each action creates a timestamped history record.",
  "page.alerts.title": "Alerts · Needs Attention",
  "page.alerts.subtitle": "Review and resolve the batches that need action.",
  "alerts.open": "Open",
  "page.reports.title": "Reports & Analytics",
  "page.reports.subtitle": "Insights across stock, movement and warehouses.",
  "page.security.title": "Security Center",
  "page.security.subtitle":
    "Access control, session status and a full audit trail of inventory changes.",
  "page.settings.title": "Settings",
  "page.settings.subtitle": "Manage your account and system configuration.",
  "page.profile.title": "User Profile",

  "tutorial.title": "Tutorial",
  "tutorial.subtitle": "Learn how to use CropVault step by step, with visuals.",
  "tutorial.choose": "Choose how you use CropVault",
  "tutorial.chooseHint": "Pick a role to see a guided walkthrough with images.",
  "tutorial.worker": "As a Worker",
  "tutorial.manager": "As a Manager",
  "tutorial.workerTag": "Add & view inventory",
  "tutorial.managerTag": "Control, sell & oversee everything",
  "tutorial.back": "Back",
  "tutorial.start": "Start walkthrough",
  "tutorial.stepsCount": "steps",
  "tutorial.step": "Step",
  "tutorial.workerDone": "You're ready to add and track stock.",
  "tutorial.managerDone": "You're ready to run the whole warehouse.",
};

const hi: Dict = {
  "nav.dashboard": "डैशबोर्ड",
  "nav.inventory": "इन्वेंटरी",
  "nav.addInventory": "इन्वेंटरी जोड़ें",
  "nav.warehouses": "गोदाम",
  "nav.categories": "श्रेणियाँ",
  "nav.stockMovement": "स्टॉक हलचल",
  "nav.alerts": "अलर्ट",
  "nav.reports": "रिपोर्ट और एनालिटिक्स",
  "nav.security": "सुरक्षा केंद्र",
  "nav.settings": "सेटिंग्स",
  "nav.profile": "यूज़र प्रोफ़ाइल",
  "nav.tutorial": "ट्यूटोरियल",

  "brand.cropWarehouse": "फसल गोदाम",
  "brand.tagline": "स्मार्ट फसल गोदाम",

  "topbar.search": "इन्वेंटरी, फसल या बैच खोजें…",
  "topbar.currentWarehouse": "वर्तमान गोदाम",
  "topbar.warehouse": "गोदाम",
  "topbar.notifications": "सूचनाएँ",
  "topbar.language": "भाषा",

  "sidebar.secureSession": "सुरक्षित सत्र",
  "sidebar.roleEnforced": "भूमिका-आधारित पहुँच लागू है। {name} के रूप में साइन इन।",
  "sidebar.logOut": "लॉग आउट",

  "page.dashboard.welcome": "वापसी पर स्वागत है, {name} 👋",

  "page.inventory.title": "इन्वेंटरी",
  "page.inventory.subtitle": "{total} में से {shown} बैच दिखाए गए",
  "page.addInventory.title": "इन्वेंटरी जोड़ें",
  "page.addInventory.subtitle":
    "मौजूदा टैग एक बार स्कैन करें, या विवरण मैन्युअल रूप से दर्ज करें। भंडारण की तारीख और समय स्वतः दर्ज होता है।",
  "page.warehouses.title": "गोदाम",
  "page.warehouses.subtitle": "भंडारण सुविधाएँ, सेक्शन और रैक — गोदाम देखने के लिए टैप करें।",
  "page.categories.title": "श्रेणियाँ",
  "page.categories.subtitle": "आपके गोदामों में फसल श्रेणी के अनुसार स्टॉक।",
  "page.stockMovement.title": "स्टॉक हलचल",
  "page.stockMovement.subtitle":
    "हर बदलाव दर्ज करें — प्रत्येक क्रिया से समय-मुद्रित इतिहास रिकॉर्ड बनता है।",
  "page.alerts.title": "अलर्ट · ध्यान दें",
  "page.alerts.subtitle": "कार्रवाई योग्य बैचों की समीक्षा करें और समाधान करें।",
  "alerts.open": "खोलें",
  "page.reports.title": "रिपोर्ट और एनालिटिक्स",
  "page.reports.subtitle": "स्टॉक, हलचल और गोदामों पर अंतर्दृष्टि।",
  "page.security.title": "सुरक्षा केंद्र",
  "page.security.subtitle":
    "पहुँच नियंत्रण, सत्र स्थिति और इन्वेंटरी बदलावों का पूरा ऑडिट ट्रेल।",
  "page.settings.title": "सेटिंग्स",
  "page.settings.subtitle": "अपना खाता और सिस्टम विन्यास प्रबंधित करें।",
  "page.profile.title": "यूज़र प्रोफ़ाइल",

  "tutorial.title": "ट्यूटोरियल",
  "tutorial.subtitle": "दृश्यों के साथ चरण-दर-चरण CropVault उपयोग करना सीखें।",
  "tutorial.choose": "चुनें कि आप CropVault कैसे उपयोग करते हैं",
  "tutorial.chooseHint": "छवियों के साथ गाइडेड वॉकथ्रू देखने के लिए एक भूमिका चुनें।",
  "tutorial.worker": "वर्कर के रूप में",
  "tutorial.manager": "मैनेजर के रूप में",
  "tutorial.workerTag": "इन्वेंटरी जोड़ें और देखें",
  "tutorial.managerTag": "नियंत्रण, बिक्री और सब कुछ देखरेख",
  "tutorial.back": "वापस",
  "tutorial.start": "वॉकथ्रू शुरू करें",
  "tutorial.stepsCount": "चरण",
  "tutorial.step": "चरण",
  "tutorial.workerDone": "आप स्टॉक जोड़ने और ट्रैक करने के लिए तैयार हैं।",
  "tutorial.managerDone": "आप पूरा गोदाम चलाने के लिए तैयार हैं।",
};

const mr: Dict = {
  "nav.dashboard": "डॅशबोर्ड",
  "nav.inventory": "इन्व्हेंटरी",
  "nav.addInventory": "इन्व्हेंटरी जोडा",
  "nav.warehouses": "गोदामे",
  "nav.categories": "श्रेण्या",
  "nav.stockMovement": "साठा हलचल",
  "nav.alerts": "सूचना",
  "nav.reports": "अहवाल आणि विश्लेषण",
  "nav.security": "सुरक्षा केंद्र",
  "nav.settings": "सेटिंग्ज",
  "nav.profile": "वापरकर्ता प्रोफाइल",
  "nav.tutorial": "ट्युटोरिअल",

  "brand.cropWarehouse": "पीक गोदाम",
  "brand.tagline": "स्मार्ट पीक गोदाम",

  "topbar.search": "इन्व्हेंटरी, पीक किंवा बैच शोधा…",
  "topbar.currentWarehouse": "सध्याचे गोदाम",
  "topbar.warehouse": "गोदाम",
  "topbar.notifications": "सूचना",
  "topbar.language": "भाषा",

  "sidebar.secureSession": "सुरक्षित सत्र",
  "sidebar.roleEnforced": "भूमिका-आधारित प्रवेश लागू. {name} म्हणून साइन इन केले.",
  "sidebar.logOut": "बाहेर पडा",

  "page.dashboard.welcome": "पुन्हा स्वागत आहे, {name} 👋",

  "page.inventory.title": "इन्व्हेंटरी",
  "page.inventory.subtitle": "{total} पैकी {shown} बैच दाखवले",
  "page.addInventory.title": "इन्व्हेंटरी जोडा",
  "page.addInventory.subtitle":
    "विद्यमान टॅग एकदा स्कॅन करा, किंवा तपशील हस्तगत भरा. साठवणुकीची तारीख व वेळ स्वयंचलितपणे नोंदवली जाते.",
  "page.warehouses.title": "गोदामे",
  "page.warehouses.subtitle": "साठवण सुविधा, विभाग आणि रॅक — गोदाम पाहण्यासाठी टॅप करा.",
  "page.categories.title": "श्रेण्या",
  "page.categories.subtitle": "तुमच्या गोदामांमध्ये पीक श्रेणीनुसार साठा.",
  "page.stockMovement.title": "साठा हलचल",
  "page.stockMovement.subtitle":
    "प्रत्येक बदल नोंदवा — प्रत्येक कृती वेळ-मुद्रित इतिहास रेकॉर्ड तयार करते.",
  "page.alerts.title": "सूचना · लक्ष द्या",
  "page.alerts.subtitle": "कार्ययोग्य बैचंचे पुनरावलोकन करा आणि निवारण करा.",
  "alerts.open": "उघडा",
  "page.reports.title": "अहवाल आणि विश्लेषण",
  "page.reports.subtitle": "साठा, हलचल आणि गोदामांविषयी आंतरदृष्टी.",
  "page.security.title": "सुरक्षा केंद्र",
  "page.security.subtitle":
    "प्रवेश नियंत्रण, सत्र स्थिती आणि इन्व्हेंटरी बदलांचा संपूर्ण ऑडिट ट्रेल.",
  "page.settings.title": "सेटिंग्ज",
  "page.settings.subtitle": "तुमचे खाते आणि सिस्टम कॉन्फिगरेशन व्यवस्थापित करा.",
  "page.profile.title": "वापरकर्ता प्रोफाइल",

  "tutorial.title": "ट्युटोरिअल",
  "tutorial.subtitle": "दृश्यांसह टप्प्याटप्प्याने CropVault वापरणे शिका.",
  "tutorial.choose": "तुम्ही CropVault कसे वापरता ते निवडा",
  "tutorial.chooseHint": "प्रतिमांसह मार्गदर्शित वॉकथ्रू पाहण्यासाठी भूमिका निवडा.",
  "tutorial.worker": "कार्यकर्ता म्हणून",
  "tutorial.manager": "व्यवस्थापक म्हणून",
  "tutorial.workerTag": "इन्व्हेंटरी जोडा आणि पहा",
  "tutorial.managerTag": "नियंत्रण, विक्री आणि सर्व काही पाहणे",
  "tutorial.back": "मागे",
  "tutorial.start": "वॉकथ्रू सुरू करा",
  "tutorial.stepsCount": "पायऱ्या",
  "tutorial.step": "पायरी",
  "tutorial.workerDone": "तुम्ही साठा जोडणे आणि मागोवा घेण्यास सज्ज आहात.",
  "tutorial.managerDone": "तुम्ही संपूर्ण गोदाम चालवण्यास सज्ज आहात.",
};

const DICT: Record<Lang, Dict> = { en, hi, mr };

/**
 * Literal label translations for data-driven UI (statuses, alert types/states,
 * priorities, categories, actions, section titles, buttons). Keyed by the exact
 * English string shown in the app. `en` is intentionally empty (identity), and
 * any missing entry falls back to the original English text.
 */
const LABELS: Record<Lang, Dict> = {
  en: {},
  hi: {
    // Freshness statuses
    FRESH: "ताज़ा",
    GOOD: "अच्छी स्थिति",
    "SELL SOON": "जल्दी बेचें",
    URGENT: "अति आवश्यक",
    CRITICAL: "गंभीर",
    INSPECT: "जाँच करें",
    // Alert types
    "LOW STOCK": "कम स्टॉक",
    "OLD STOCK": "पुराना स्टॉक",
    "STORAGE DURATION WARNING": "भंडारण अवधि चेतावनी",
    "INSPECTION REQUIRED": "निरीक्षण आवश्यक",
    // Alert states
    all: "सभी",
    Open: "खुला",
    "In Review": "समीक्षा में",
    Resolved: "हल हो गया",
    // Priorities
    Critical: "गंभीर",
    High: "उच्च",
    Medium: "मध्यम",
    Low: "कम",
    // Categories
    Vegetables: "सब्जियाँ",
    Fruits: "फल",
    "Grains / Cereals": "अनाज",
    "Cold Storage": "कोल्ड स्टोरेज",
    "Other Crops": "अन्य फसलें",
    // Storage types
    Ambient: "सामान्य तापमान",
    "Humidity Controlled": "नियंत्रित नमी",
    // Movement actions
    ADD: "जोड़ें",
    SELL: "बेचें",
    MOVE: "स्थानांतरित",
    REMOVE: "हटाएं",
    DISPOSE: "निपटान",
    "Add Stock": "स्टॉक जोड़ें",
    "Move Stock": "स्टॉक स्थानांतरित करें",
    "Sell Stock": "स्टॉक बेचें",
    "Remove Stock": "स्टॉक हटाएं",
    "Dispose Stock": "स्टॉक निपटाएं",
    added: "जोड़ा गया",
    sold: "बेचा गया",
    moved: "स्थानांतरित",
    removed: "हटाया गया",
    disposed: "निपटाया गया",
    // Recommendations
    "SELL NOW · INSPECT": "अभी बेचें · जाँच करें",
    "PRIORITIZE SALE": "बिक्री को प्राथमिकता दें",
    // Dashboard
    "Needs Attention": "ध्यान दें",
    "Batches that require action now — sorted by urgency & freshness.":
      "अभी कार्रवाई योग्य बैच — आवश्यकता और ताज़गी अनुसार क्रमबद्ध।",
    "View all": "सभी देखें",
    "🎉 Nothing needs attention right now. All stock is fresh.":
      "🎉 अभी किसी ध्यान देने की ज़रूरत नहीं। सारा स्टॉक ताज़ा है।",
    "Inventory by Category": "श्रेणी अनुसार इन्वेंटरी",
    "Distribution of stock across the warehouse.": "गोदाम में स्टॉक का वितरण।",
    "Total Inventory": "कुल इन्वेंटरी",
    "Warehouse Overview": "गोदाम अवलोकन",
    "Tap a warehouse to open its inventory.": "इन्वेंटरी खोलने के लिए गोदाम पर टैप करें।",
    Stock: "स्टॉक",
    Batches: "बैच",
    Alerts: "अलर्ट",
    "Recent Activity": "हाल की गतिविधि",
    Live: "लाइव",
    "Total Stock": "कुल स्टॉक",
    "Total Batches": "कुल बैच",
    Warehouses: "गोदाम",
    "Add Inventory": "इन्वेंटरी जोड़ें",
    "Your warehouse at a glance": "एक नज़र में आपका गोदाम",
    "Last synchronized": "अंतिम सिंक",
    "Scanning is optional": "स्कैनिंग वैकल्पिक है",
    "Scan an existing QR/barcode once to identify a batch, or enter details manually — you never need to re-scan to review what is stored.":
      "बैच पहचानने के लिए मौजूदा QR/बारकोड एक बार स्कैन करें, या विवरण मैन्युअल रूप से दर्ज करें — भंडारित सामग्री देखने के लिए दोबारा स्कैन करने की ज़रूरत नहीं।",
    "Open scanner": "स्कैनर खोलें",
    // Inventory table + filters
    Crop: "फसल",
    Category: "श्रेणी",
    Batch: "बैच",
    Quantity: "मात्रा",
    Warehouse: "गोदाम",
    Location: "स्थान",
    "Stored On": "भंडारण दिनांक",
    Duration: "अवधि",
    Status: "स्थिति",
    Actions: "क्रियाएँ",
    "All categories": "सभी श्रेणियाँ",
    "All warehouses": "सभी गोदाम",
    "All locations": "सभी स्थान",
    "All statuses": "सभी स्थिति",
    View: "देखें",
    Rack: "रैक",
    "Reset filters": "फ़िल्टर रीसेट करें",
    "Search crop, batch or rack…": "फसल, बैच या रैक खोजें…",
    "Filter batch #": "बैच # फ़िल्टर करें",
    Sort: "क्रमबद्ध",
    "Storage date": "भंडारण दिनांक",
    Urgency: "आवश्यकता",
    "FIFO: sell this batch first": "FIFO: पहले यह बैच बेचें",
    "No inventory found": "कोई इन्वेंटरी नहीं मिली",
    "Try changing your filters or add a new crop batch.":
      "अपने फ़िल्टर बदलें या नया फसल बैच जोड़ें।",
    // Stock movement
    "New movement": "नई हलचल",
    "Select batch…": "बैच चुनें…",
    "Destination rack": "गंतव्य रैक",
    "Select rack…": "रैक चुनें…",
    "Recording…": "दर्ज हो रहा है…",
    "Your role can’t record movements.": "आपकी भूमिका हलचल दर्ज नहीं कर सकती।",
    "Movement log": "हलचल लॉग",
    records: "रिकॉर्ड",
    "No movements yet": "अभी कोई हलचल नहीं",
    "Recorded actions will appear here.": "दर्ज की गई क्रियाएँ यहाँ दिखेंगी।",
    Date: "दिनांक",
    Time: "समय",
    Action: "क्रिया",
    Qty: "मात्रा",
    "From → To": "से → तक",
    By: "द्वारा",
    // Alerts page
    "All alert types": "सभी अलर्ट प्रकार",
    "Nothing here": "यहाँ कुछ नहीं",
    "No alerts match the current filters.": "वर्तमान फ़िल्टर से कोई अलर्ट मेल नहीं खाता।",
    Open_: "खोलें",
    "Mark In Review": "समीक्षा में चिह्नित करें",
    Resolve: "समाधान करें",
    Reopen: "पुः खोलें",
    "review by manager": "प्रबंधक द्वारा समीक्षा",
  },
  mr: {
    // Freshness statuses
    FRESH: "ताजे",
    GOOD: "चांगली स्थिती",
    "SELL SOON": "लवकर विका",
    URGENT: "अत्यंत आवश्यक",
    CRITICAL: "गंभीर",
    INSPECT: "तपासणी करा",
    // Alert types
    "LOW STOCK": "कमी साठा",
    "OLD STOCK": "जुना साठा",
    "STORAGE DURATION WARNING": "साठवण काल सूचना",
    "INSPECTION REQUIRED": "तपासणी आवश्यक",
    // Alert states
    all: "सर्व",
    Open: "खुले",
    "In Review": "पुनरावलोकनात",
    Resolved: "निकालले",
    // Priorities
    Critical: "गंभीर",
    High: "उच्च",
    Medium: "मध्यम",
    Low: "कमी",
    // Categories
    Vegetables: "भाज्या",
    Fruits: "फळे",
    "Grains / Cereals": "धान्य",
    "Cold Storage": "थंड साठवण",
    "Other Crops": "इतर पिके",
    // Storage types
    Ambient: "सामान्य तापमान",
    "Humidity Controlled": "आर्द्रता नियंत्रित",
    // Movement actions
    ADD: "जोडा",
    SELL: "विका",
    MOVE: "हलवा",
    REMOVE: "काढा",
    DISPOSE: "नावा",
    "Add Stock": "साठा जोडा",
    "Move Stock": "साठा हलवा",
    "Sell Stock": "साठा विका",
    "Remove Stock": "साठा काढा",
    "Dispose Stock": "साठा नावा",
    added: "जोडले गेले",
    sold: "विकले गेले",
    moved: "हलवले",
    removed: "काढले गेले",
    disposed: "नावले गेले",
    // Recommendations
    "SELL NOW · INSPECT": "आता विका · तपासणी",
    "PRIORITIZE SALE": "विक्रीला प्राधान्य द्या",
    // Dashboard
    "Needs Attention": "लक्ष द्या",
    "Batches that require action now — sorted by urgency & freshness.":
      "आता कार्ययोग्य बैच — तातडी आणि ताजेपणानुसार क्रमवारी.",
    "View all": "सर्व पहा",
    "🎉 Nothing needs attention right now. All stock is fresh.":
      "🎉 आता लक्ष देण्याची गरज नाही. सर्व साठा ताजा आहे.",
    "Inventory by Category": "श्रेणीनुसार इन्व्हेंटरी",
    "Distribution of stock across the warehouse.": "गोदामातील साठ्याचे वितरण.",
    "Total Inventory": "एकूण इन्व्हेंटरी",
    "Warehouse Overview": "गोदाम आढावा",
    "Tap a warehouse to open its inventory.": "इन्व्हेंटरी उघडण्यासाठी गोदामावर टॅप करा.",
    Stock: "साठा",
    Batches: "बॅच",
    Alerts: "सूचना",
    "Recent Activity": "अलीकडील क्रिया",
    Live: "लाइव्ह",
    "Total Stock": "एकूण साठा",
    "Total Batches": "एकूण बॅच",
    Warehouses: "गोदामे",
    "Add Inventory": "इन्व्हेंटरी जोडा",
    "Your warehouse at a glance": "एका दृष्टिक्षेपात तुमचे गोदाम",
    "Last synchronized": "शेवटचे सिंक",
    "Scanning is optional": "स्कॅनिंग ऐच्छिक आहे",
    "Scan an existing QR/barcode once to identify a batch, or enter details manually — you never need to re-scan to review what is stored.":
      "बॅच ओळखण्यासाठी विद्यमान QR/बारकोड एकदा स्कॅन करा, किंवा तपशील हस्तगत भरा — साठवलेली वस्तू पाहण्यासाठी पुन्हा स्कॅन करण्याची गरज नाही.",
    "Open scanner": "स्कॅनर उघडा",
    // Inventory table + filters
    Crop: "पीक",
    Category: "श्रेणी",
    Batch: "बॅच",
    Quantity: "प्रमाण",
    Warehouse: "गोदाम",
    Location: "ठिकाण",
    "Stored On": "साठवणीची तारीख",
    Duration: "कालावधी",
    Status: "स्थिती",
    Actions: "कृती",
    "All categories": "सर्व श्रेण्या",
    "All warehouses": "सर्व गोदामे",
    "All locations": "सर्व ठिकाणे",
    "All statuses": "सर्व स्थिती",
    View: "पहा",
    Rack: "रॅक",
    "Reset filters": "फिल्टर रीसेट करा",
    "Search crop, batch or rack…": "पीक, बॅच किंवा रॅक शोधा…",
    "Filter batch #": "बॅच # फिल्टर करा",
    Sort: "क्रमवारी",
    "Storage date": "साठवणीची तारीख",
    Urgency: "तातडी",
    "FIFO: sell this batch first": "FIFO: आधी हा बॅच विका",
    "No inventory found": "इन्व्हेंटरी आढळली नाही",
    "Try changing your filters or add a new crop batch.":
      "तुमचे फिल्टर बदला किंवा नवीन पीक बॅच जोडा.",
    // Stock movement
    "New movement": "नवीन हलचल",
    "Select batch…": "बॅच निवडा…",
    "Destination rack": "गंतব্য रॅक",
    "Select rack…": "रॅक निवडा…",
    "Recording…": "नोंदवत आहे…",
    "Your role can’t record movements.": "तुमच्या भूमिकेला हलचल नोंदवता येत नाही.",
    "Movement log": "हलचल लॉग",
    records: "रेकॉर्ड",
    "No movements yet": "अजून कोणतीही हलचल नाही",
    "Recorded actions will appear here.": "नोंदवलेल्या कृती इथे दिसतील.",
    Date: "तारीख",
    Time: "वेळ",
    Action: "कृती",
    Qty: "प्रमाण",
    "From → To": "पासून → पर्यंत",
    By: "कडून",
    // Alerts page
    "All alert types": "सर्व सूचना प्रकार",
    "Nothing here": "इथे काही नाही",
    "No alerts match the current filters.": "सध्याच्या फिल्टरशी कोणतीही सूचना जुळत नाही.",
    Open_: "उघडा",
    "Mark In Review": "पुनरावलोकनात नोंदवा",
    Resolve: "निकाली",
    Reopen: "पुन्हा उघडा",
    "review by manager": "व्यवस्थापकाद्वारे पुनरावलोकन",
  },
};


const LS_KEY = "cropvault.lang";

interface LangCtxValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Translate a literal English UI label (statuses, categories, etc.). */
  tl: (value: string) => string;
}

const LangCtx = createContext<LangCtxValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Restore the saved language on mount (client only).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LS_KEY) as Lang | null;
      if (saved && DICT[saved]) setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(LS_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = DICT[lang][key] ?? DICT[DEFAULT_LANG][key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const tl = useCallback(
    (value: string) => {
      if (lang === "en") return value;
      return LABELS[lang][value] ?? value;
    },
    [lang]
  );

  // Keep the document language attribute in sync (a11y + font shaping).
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, tl }), [lang, setLang, t, tl]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

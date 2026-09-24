/**
 * System prompt & templates for H3 Catering Menu AI Assistant.
 * Designed to generate authentic H3-styled luxury wedding & banquet menus.
 */

export const H3_SIGNATURE_CATEGORIES = [
  "WELCOME BEVERAGES & MOCKTAIL LOUNGE",
  "GEMS OF H3 CHAAT",
  "CHAAT PAINT ON UR PLATES BY H3 GEMS",
  "KOLKATA GUPCHUP & STREET CORNER",
  "CHINA TOWN BY H3 (ORIENTAL & PAN-ASIAN)",
  "ITALIANO BY H3 (WOODFIRED & LIVE PASTA)",
  "MEXICAN CANTINA & TACO BAR",
  "VADHKAAM INDIA BY H3 (REGIONAL SPECIALTIES)",
  "BHAJI BAZAAR & LIVE PAV COUNTER",
  "MASALA DHABA BY H3",
  "INDIAN CHULHA (GRAVIES & CURRIES)",
  "PUNJABI STATION & LIVE TANDOOR",
  "RAJASTHANI KACHORI & DAL BAATI LOUNGE",
  "LIVE SOUTH INDIAN TADKA",
  "ARTISANAL BREAD BASKET & NAANERY",
  "RICE & BIRYANI POTS",
  "SALAD BAR & CONTINENTAL APPETIZERS",
  "DESSERTS & SWEET INDULGENCE BY H3",
  "LIVE JALEBI, RABDI & MALPUA STATION",
  "KOLKATA TEA STALL & KULLAD CHAI (TEA 24 BY 7)",
  "AFTER PARTY QUICK BITES & SLIDERS"
];

export const H3_DEFAULT_RULES = [
  "NO TENT / HOTEL / EVENT / OUTSIDE STAFF FOOD IS ALLOWED AT OUR PART/COUNTERS",
  "10% GUEST INCREMENT BUFFER CAN BE MANAGED BY H3 CATERING ON PRIOR INTIMATION",
  "MINIMUM 125 KVA DEDICATED DIESEL GENERATOR (DG) POWER BACKUP REQUIRED AT KITCHEN & SERVICE AREA",
  "KITCHEN ACCESS & UTILITY SETUP MUST BE HANDED OVER 6 HOURS PRIOR TO FIRST EVENT",
  "MINERAL WATER CANS, SOFT DRINKS, RED BULL, ICE CUBES & BAR WARE CONSUMABLES AS PER AGREED SCOPE",
  "HOST MUST PROVIDE SUITABLE STORAGE ROOM, WASH AREA AND CLEAN POTABLE RUNNING WATER SUPPLY"
];

export const H3_TERMS_AND_CONDITIONS = [
  "Booking Confirmation: 30% advance on signing, 50% one week prior to event date, balance 20% on event conclusion day.",
  "Guest Count Commitment: Minimum guaranteed pax will be billed even if attendance is lower. Excess pax above 10% tolerance will be billed at full per-plate rate.",
  "Food Quality & Serving Hours: Food will be served hot and fresh during scheduled session timings only. Counters will close 30 minutes after scheduled end time.",
  "Leftovers & Hygiene: As per FSSAI & Chhattisgarh Caterers Association guidelines, leftover cooked food will not be handed over post 3 hours of session closure for hygiene and health safety.",
  "Infrastructure & Utilities: Adequate uninterrupted electricity, lighting at kitchen yard, running potable water and waste disposal bins are in the client's / venue scope.",
  "Damage & Breakage: Any severe breakage or damage to luxury crockery, customized display stalls or equipment caused by event attendees will be charged at cost.",
  "Cancellation Policy: Advances are non-refundable in case of cancellation within 30 days of the event date. Rescheduling subject to date availability."
];

export const SYSTEM_PROMPT = `You are the H3 Catering Menu AI Assistant — the expert menu planner for "H3 Catering & Hospitality" (H3MS).
Your purpose is to assist event managers, clients, and catering directors in crafting complete, luxury, mouthwatering wedding and banquet catering menus, and automatically structuring them into a ready-to-print format.

### Brand Persona & Tone
- Sophisticated, hospitable, proactive, and culinary-savvy.
- You understand luxury Indian destination weddings (Marwari, Gujarati, Punjabi, Bengali, Fusion, Royal banquets).
- You know H3's signature culinary brands (e.g., "CHAAT PAINT ON UR PLATES BY H3 GEMS", "CHINA TOWN BY H3", "ITALIANO BY H3", "MASALA DHABA BY H3", "TEA 24 BY 7").

### What You Collect & Structure
1. **Event Overview**: Client name, Event title (e.g., "Agrawal Wedding"), City / Venues (e.g., "Kolkata - Marriott & Lalit Mahal"), Event Dates.
2. **Sessions Schedule**: Date, Session Name (e.g., "Welcome Lunch", "Hi-Tea & Mayra", "Sangeet Dinner", "Baraat Swagat & Grand Dinner", "After Party"), Timings, Pax count, Setup/Venue instructions.
3. **Session-wise Menus**:
   - Organized into clear categories (e.g. Welcome Drinks, Chaat, Live Counters, Starters, Main Course, Breads, Rice, Desserts, Tea/Beverages).
   - Items with appealing dish descriptions and live station callouts (e.g. "Live Teppanyaki Counter", "Kullad Chai Bar").
4. **Staff Meal Counts**: Day-wise breakdown for Breakfast, Lunch, Hi-Tea, Dinner (for event staff, drivers, security).
5. **Special Rules & Logistics**: DG power requirement, staff food rules, 10% pax buffer, water/ice supply, service gates.

### OUTPUT FORMAT REQUIREMENT (CRITICAL):
You MUST ALWAYS include a JSON block enclosed between \`\`\`json and \`\`\` at the end of your message whenever there is updated menu information.
The JSON must follow this exact schema:

\`\`\`json
{
  "clientName": "string",
  "eventName": "string",
  "city": "string",
  "venue": "string",
  "dates": "string",
  "sessions": [
    {
      "id": "session_1",
      "date": "DEC 3",
      "name": "WELCOME LUNCH",
      "timings": "1:00 PM - 4:00 PM",
      "pax": 250,
      "venue": "Marriott Courtyard",
      "notes": "2 Setup (200 & 300)",
      "categories": [
        {
          "name": "WELCOME BEVERAGES",
          "items": [
            { "name": "Fresh Tender Coconut Water", "description": "Served in fresh shell with straw" },
            { "name": "Spiced Jamun Shots", "description": "With black salt & mint rim" }
          ]
        },
        {
          "name": "GEMS OF H3 CHAAT (LIVE)",
          "isLiveCounter": true,
          "items": [
            { "name": "Kolkata Phuchka with 4 Waters", "description": "Pudina, Khatta Meetha, Hing, Hajmola" },
            { "name": "Palak Patta Chaat Crisps", "description": "Layered with sweet yogurt & saunth" }
          ]
        },
        {
          "name": "MAIN COURSE",
          "items": [
            { "name": "Paneer Lababdar", "description": "Cottage cheese cubes in rich tomato-onion gravy" },
            { "name": "Dal Bukhara", "description": "Slow cooked black lentils with churned white butter" }
          ]
        },
        {
          "name": "DESSERTS",
          "items": [
            { "name": "Hot Gulab Jamun with Rabdi", "description": "" },
            { "name": "Artisanal Kesar Kulfi Falooda", "description": "" }
          ]
        }
      ]
    }
  ],
  "staffMeals": [
    { "date": "3rd Dec", "breakfast": 40, "lunch": 50, "hiTea": 40, "dinner": 60, "notes": "" },
    { "date": "4th Dec", "breakfast": 50, "lunch": 60, "hiTea": 60, "dinner": 80, "notes": "" },
    { "date": "5th Dec", "breakfast": 20, "lunch": 0, "hiTea": 0, "dinner": 0, "notes": "" }
  ],
  "rules": [
    "NO TENT | HOTEL | EVENT | OR ANY OTHER STAFF FOOD IS ALLOWED AT OUR PART",
    "10% OF GUEST INCREMENT CAN BE MANAGEABLE BY H3 CATERING",
    "125 KVA DG POWER BACKUP MANDATORY AT KITCHEN YARD"
  ]
}
\`\`\`

### Conversation Flow:
- When the user pastes raw unorganized text (like a raw WhatsApp plan with sessions, dates, dishes, pax counts), IMMEDIATELY parse all of it, fill in the structure with appetizing dish names where implied, and return the complete JSON structure alongside an organized summary.
- If some details are missing, suggest tasteful additions (e.g., "Would you like to add a live Charcoal Tandoori Station or a Gourmet Dessert Bar for the Sangeet Dinner?").
- Always be ready to refine or add sessions, dishes, staff meal numbers, and custom rules whenever the user asks.
`;

export const SAMPLE_KOLKATA_WEDDING = {
  clientName: "Agrawal Family",
  eventName: "Agrawal Destination Wedding",
  city: "Kolkata",
  venue: "JW Marriott & Lalit Great Eastern",
  dates: "DEC 3 - DEC 5",
  sessions: [
    {
      id: "session_1",
      date: "DEC 3",
      name: "WELCOME LUNCH",
      timings: "1:00 PM - 4:00 PM",
      pax: 250,
      venue: "Marriott Banquet Hall & Lawns",
      notes: "2 Setup (200 & 300) - Kolkata Tea 24x7 Counter Active",
      categories: [
        {
          name: "WELCOME DRINKS & REFRESHERS",
          items: [
            { name: "Fresh Nariyal Paani Station", description: "Chilled tender coconut with fresh malai" },
            { name: "Kolkata Gondhoraj Nimbu Shikanji", description: "Aromatic Bengal lime cooler" },
            { name: "Cranberry Basil Punch", description: "Infused with crushed ice & mint" }
          ]
        },
        {
          name: "GEMS OF H3 CHAAT (LIVE COUNTER)",
          isLiveCounter: true,
          items: [
            { name: "Kolkata Puchka with 5 Exotic Flavored Waters", description: "Pudina, Hing, Gondhoraj, Khatta Meetha, Hajmola" },
            { name: "Crispy Palak Patta Chaat", description: "Crisp spinach fritters with whipped yogurt and tamarind glaze" },
            { name: "Banarasi Tamatar Chaat", description: "Warm spiced tomato mashed chaat served in clay pots" }
          ]
        },
        {
          name: "COMFORT FOOD & LIVE APPETIZERS",
          isLiveCounter: true,
          items: [
            { name: "Live Mumbai Ragda Pattice", description: "Crisp potato patty with spiced white peas" },
            { name: "Truffle Cheese Poppers", description: "Crispy fried golden spheres with spicy mayo" }
          ]
        },
        {
          name: "MAIN COURSE - RAJASTHANI & PUNJABI ROOTS",
          items: [
            { name: "Paneer Tikka Butter Masala", description: "Charred cottage cheese in velvety makhani gravy" },
            { name: "Subz Miloni Handi", description: "Seasonal farm vegetables tossed in spinach cashew sauce" },
            { name: "Dal Maharani", description: "Slow-simmered whole black lentils with fresh churned butter" },
            { name: "Jodhpuri Gatta Curry", description: "Gram flour dumplings in spiced yogurt sauce" }
          ]
        },
        {
          name: "BREAD BASKET & RICE",
          items: [
            { name: "Assorted Tandoori Breads", description: "Butter Naan, Laccha Paratha, Missi Roti" },
            { name: "Dum Pukht Subz Biryani", description: "Fragrant basmati rice layered with saffron & veggies" },
            { name: "Burani Raita & Papad Churi", description: "Garlic infused spiced curd" }
          ]
        },
        {
          name: "DESSERTS & SWEET INDULGENCE",
          items: [
            { name: "Live Jalebi & Laccha Rabdi", description: "Hot crispy kesar jalebi with thickened creamy rabdi" },
            { name: "Warm Baked Gulab Jamun", description: "Topped with sliced pistachios and silver vark" },
            { name: "Kolkata Mishti Doi Pot", description: "Traditional caramelized baked sweet yogurt" }
          ]
        },
        {
          name: "TEA 24 BY 7 BY H3",
          items: [
            { name: "Kolkata Kulhad Chai", description: "Cardamom & Ginger infused cutting chai" },
            { name: "Assorted Green & Herbal Teas", description: "Chamomile, Jasmine, Earl Grey" }
          ]
        }
      ]
    },
    {
      id: "session_2",
      date: "DEC 3",
      name: "MAYRA & HI-TEA",
      timings: "4:00 PM - 7:00 PM",
      pax: 300,
      venue: "Lalit Mahal Poolside",
      notes: "Hi-Tea Setup with Live Snack Counters",
      categories: [
        {
          name: "BEVERAGES & SHAKES",
          items: [
            { name: "Sitaphal & Alphonso Thick Shakes", description: "Seasonal fruit pulp indulgence" },
            { name: "Ginger Masala Chai in Kullad", description: "" },
            { name: "Filter Kaapi Corner", description: "Authentic South Indian froth coffee" }
          ]
        },
        {
          name: "RAJASTHANI KACHORI LOUNGE",
          isLiveCounter: true,
          items: [
            { name: "Hot Pyaaz Ki Kachori with Kadhi", description: "Crisp flaky pastry stuffed with spiced onion" },
            { name: "Mawa Kachori with Kesar Chashni", description: "Sweet delicacy garnished with dry fruits" },
            { name: "Mini Mirchi Bada with Green Chutney", description: "Jodhpur style potato stuffed banana peppers" }
          ]
        },
        {
          name: "GLOBAL TEA BITES",
          items: [
            { name: "Wild Mushroom & Cheese Crostini", description: "Toasted baguette with sautéed wild mushrooms" },
            { name: "Assorted Slider Bar", description: "Paneer tikka slider & falafel burger with hummus" },
            { name: "Steamed Dimsums with Chilli Dip", description: "Edamame & cream cheese, water chestnut crystals" }
          ]
        }
      ]
    },
    {
      id: "session_3",
      date: "DEC 3",
      name: "SANGEET DINNER & GALA",
      timings: "8:00 PM - 12:30 AM",
      pax: 600,
      venue: "Marriott Grand Ballroom & Lawn",
      notes: "Grand Live Counters, Teppanyaki, Italian & Gourmet Indian",
      categories: [
        {
          name: "SIGNATURE COCKTAIL MOCKTAILS & SMOKING SIPS",
          items: [
            { name: "Liquid Nitrogen Smoked Paan Mojito", description: "Betel leaf and mint with dry ice fog" },
            { name: "Passion Fruit & Rosemary Sparkler", description: "Fizzy tropical cooler" },
            { name: "Blueberry Lavender Fizz", description: "Garnished with edible flowers" }
          ]
        },
        {
          name: "CHAAT PAINT ON UR PLATES BY H3 GEMS (LIVE ART)",
          isLiveCounter: true,
          items: [
            { name: "Molecular Dahi Bhalla Spheres", description: "Served with pomegranate pearls and saunth reduction" },
            { name: "Chaat on Canvas", description: "Chef's live plating on mirror canvas with crisps, chutneys and edible petals" },
            { name: "Kolkata Jhalmuri & Churmur Live Cart", description: "Spiced puffed rice and crushed puchka salad" }
          ]
        },
        {
          name: "CHINA TOWN BY H3 (LIVE PAN-ASIAN)",
          isLiveCounter: true,
          items: [
            { name: "Live Teppanyaki Station", description: "Stir fried exotic vegetables, tofu & edamame in choice of sauces" },
            { name: "Lotus Stem Honey Chilli", description: "Crispy sliced lotus roots tossed with sesame seeds" },
            { name: "Truffle Edamame Dumplings", description: "Steamed crystal basket" },
            { name: "Wok Tossed Hakka Noodles & Burnt Garlic Fried Rice", description: "" }
          ]
        },
        {
          name: "ITALIANO BY H3 (LIVE PASTA & WOODFIRED PIZZA)",
          isLiveCounter: true,
          items: [
            { name: "Handmade Ravioli in Sage Butter", description: "Spinach and ricotta filled pillows" },
            { name: "Live Penne & Fusilli Bar", description: "Choice of Arrabbiata, Alfredo and Pesto Genovese" },
            { name: "Neapolitan Thin Crust Pizza", description: "Quattro Formaggi, Funghi e Tartufo" }
          ]
        },
        {
          name: "INDIAN CHULHA & ROYAL BANQUET",
          items: [
            { name: "Paneer Kundan Qaliyan", description: "Royal Awadhi recipe with rich saffron gravy" },
            { name: "Kaju Makhana Curry", description: "Roasted foxnuts and whole cashews in royal gravy" },
            { name: "Sarson Ka Saag with Makki Roti & White Butter", description: "Winter special with jaggery" },
            { name: "Dal Moradabadi Live Counter", description: "Yellow moong dal with heeng tadka, crispy papdi & amchoor" }
          ]
        },
        {
          name: "DESSERTS & PASTRY THEATER",
          isLiveCounter: true,
          items: [
            { name: "Live Nitrogen Ice Cream Factory", description: "Belgian Chocolate & Tender Coconut created fresh in 30 seconds" },
            { name: "Hot Moong Dal Halwa with Dry Fruit Crumble", description: "Pure desi ghee delicacy" },
            { name: "Pariwar Special Malai Ghevar with Rabdi", description: "Traditional Rajasthani honeycomb sweet" },
            { name: "Gourmet Churros with Dulce de Leche", description: "Cinnamon sugar coated" }
          ]
        }
      ]
    },
    {
      id: "session_4",
      date: "DEC 4",
      name: "BARAAT SWAGAT & GRAND WEDDING DINNER",
      timings: "1:00 PM (Swagat) | Dinner 8:00 PM - 1:00 AM",
      pax: 1000,
      venue: "Lalit Mahal Main Gate & Central Lawns",
      notes: "Baraat Swagat at 1:00 PM at Lalit Mahal Main Gate with Fruit Champion & Decides. Phera: 4 moveable setups (300 pax, 4pm-7pm). Nikashi at Marriott Parking Gate (11am, 5 servers, 150 water cans, Red Bull, dry fruits).",
      categories: [
        {
          name: "BARAAT SWAGAT SPECIALS (MAIN GATE)",
          items: [
            { name: "Fruit Champion Display & Exotic Platters", description: "Imported berries, dragon fruit, kiwi, cherries on ice carvings" },
            { name: "Chilled Red Bull, Mineral Water & Tender Coconut", description: "Served by 5 dedicated servers" },
            { name: "Royal Saffron Sherbet & Gulab Jal Thandai", description: "Silver cups with crushed almonds" }
          ]
        },
        {
          name: "PHERA SNACKS & CONTINUOUS HI-TEA (4PM - 7PM)",
          items: [
            { name: "Moveable Phera Snack Trolleys", description: "Mini kachori, paneer skewers, dry fruit baskets" },
            { name: "Tea 24x7 Kullad Chai & Cookies", description: "" }
          ]
        },
        {
          name: "GRAND WEDDING RECEPTION DINNER (8PM - 1AM)",
          items: [
            { name: "H3 Shahi Dawat Main Courses (12 Specialties)", description: "Paneer Nazakat, Veg Rogan Josh, Dal Makhani H3 Heritage, Subz Dum Handi" },
            { name: "Live Tandoor & Sheermal Counter", description: "Tandoori Kulchas, Warqi Parathas, Roomali, Taftan" },
            { name: "Hydrabadi Zafrani Dum Biryani & Mirchi Ka Salan", description: "Slow cooked under sealed clay dough" },
            { name: "Grand Dessert Pavilion (18 Varieties)", description: "Rasmalai Tres Leches, Kesar Jalebi, Shahi Tukda, Kulfi Sticks, Baklava" }
          ]
        }
      ]
    },
    {
      id: "session_5",
      date: "DEC 5",
      name: "FAREWELL BREAKFAST",
      timings: "7:30 AM - 11:00 AM",
      pax: 150,
      venue: "Marriott Coffee Shop & Patio",
      notes: "Light breakfast and travel packs",
      categories: [
        {
          name: "LIVE SOUTH INDIAN & POORI BHAJI",
          items: [
            { name: "Live Crispy Ghee Dosa & Steamed Idli", description: "With 3 coconut chutneys & piping hot sambar" },
            { name: "Bedmi Poori with Hing Aloo Rasedaar", description: "Traditional breakfast with methi chutney" },
            { name: "Poha with Sev & Fried Peanuts", description: "Indori style spiced flattened rice" },
            { name: "Fresh Cut Fruits, Juices & Hot Coffee/Tea", description: "" }
          ]
        }
      ]
    }
  ],
  staffMeals: [
    { date: "3rd Dec", breakfast: 40, lunch: 50, hiTea: 40, dinner: 60, notes: "Marriott & Lalit staff" },
    { date: "4th Dec", breakfast: 50, lunch: 60, hiTea: 60, dinner: 80, notes: "Peak wedding setup crew" },
    { date: "5th Dec", breakfast: 20, lunch: 0, hiTea: 0, dinner: 0, notes: "Departure crew" }
  ],
  rules: [
    "NO TENT | HOTEL | EVENT | OR ANY OTHER STAFF FOOD IS ALLOWED AT OUR PART",
    "10% OF GUEST INCREMENT CAN BE MANAGEABLE BY CAT",
    "125 KVA DG POWER BACKUP MANDATORY FOR KITCHEN",
    "NIKASHI: 4-DEC MARRIOT PARKING GATE - 11 AM, 5 SERVERS, 150 WATER CANS, RED BULL, DRY FRUITS",
    "BARAAT SWAGAT: 1 PM AT LALIT MAHAL MAIN GATE WITH FRUIT CHAMPION & ALL DECIDES"
  ]
};

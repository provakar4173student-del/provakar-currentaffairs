/* ==========================================================================
   PROVAKAR LEARNING MANAGEMENT ENGINE - CORE DATABASE v3.0
   ========================================================================== */

const DBConfig = {
  name: "ProvakarLMS_Storage",
  version: 1,
  stores: {
    subjects: "id",          // সাবজেক্ট ও চ্যাপ্টার ডিরেক্টরির জন্য
    current_affairs: "year", // বছর ও মাস ভিত্তিক কারেন্ট অ্যাফেয়ার্স
    state: "key"             // অ্যাপের গ্লোবাল সেটিংস ও স্টেট
  }
};

const DatabaseEngine = {
  db: null,

  // ডাটাবেস শুরু করার মেথড
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DBConfig.name, DBConfig.version);

      request.onerror = () => {
        console.error("Database connection failed:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("Database initialized successfully.");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // আনলিমিটেড ডাটা স্টোরের জন্য টেবিল/স্টোর তৈরি
        Object.entries(DBConfig.stores).forEach(([storeName, keyPath]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: keyPath });
          }
        });
      };
    });
  },

  // ডাটা সেভ বা আপডেট করার মেথড
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  // সমস্ত ডাটা একসাথে তুলে আনার মেথড
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // নির্দিষ্ট একটি ডাটা খোঁজার মেথড
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};

/* ==========================================================================
   SAMPLE DATA SEEDER (টেস্টিং ডাটা স্ট্রাকচার)
   ========================================================================== */
const InitialDataSeeder = {
  async run() {
    const existingSubjects = await DatabaseEngine.getAll("subjects");
    
    // ডাটাবেস যদি ফাঁকা থাকে, তবে একটি ডেমো স্ট্রাকচার সেট হবে
    if (existingSubjects.length === 0) {
      console.log("Seeding initial hierarchical data...");

      // ১. সাবজেক্ট এবং নেস্টেড চ্যাপ্টার মডেল
      await DatabaseEngine.put("subjects", {
        id: "sub_history",
        name: "ইতিহাস (History)",
        chapters: [
          {
            id: "ch_indus",
            name: "সিন্ধু সভ্যতা ও হরপ্পা সংস্কৃতি",
            questions: [
              {
                id: "q_h1",
                question: "হরপ্পা সভ্যতা কোন নদীর তীরে অবস্থিত ছিল?",
                optA: "সিন্ধু", optB: "রাভি (ইরাবতী)", optC: "গঙ্গা", optD: "নর্মদা",
                correct: "B",
                explanation: "হরপ্পা বর্তমান পাকিস্তানের পাঞ্জাব প্রদেশের রাভি বা ইরাবতী নদীর তীরে অবস্থিত ছিল।"
              }
            ]
          },
          {
            id: "ch_vedic",
            name: "বৈদিক যুগ ও আর্য সভ্যতা",
            questions: []
          }
        ]
      });

      // ২. কারেন্ট অ্যাফেয়ার্স বছর ও মাস ভিত্তিক মডেল
      await DatabaseEngine.put("current_affairs", {
        year: "2026",
        months: {
          "জানুয়ারি": [
            { id: "ca_26_j1", category: "পশ্চিমবঙ্গ", text: "২০২৬ সালের জানুয়ারি মাসে রাজ্যজুড়ে নতুন পঞ্চায়েত ডিজিটাল পোর্টাল চালু হয়েছে।" }
          ],
          "ফেব্রুয়ারি": [
            { id: "ca_26_f1", category: "জাতীয়", text: "২০২৬ কেন্দ্রীয় বাজেট পেশ করা হয়েছে যেখানে গ্রামীণ উন্নয়নে বিশেষ জোর দেওয়া হয়েছে।" }
          ]
        }
      });
      
      console.log("Seeding completed.");
    }
  }
};

// গ্লোবাল বুটস্ট্র্যাপ লজিক
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await DatabaseEngine.init();
    await InitialDataSeeder.run();
    // পরবর্তী ধাপের কোড এখানে লিঙ্ক হবে
  } catch (error) {
    console.error("App startup crashed:", error);
  }
});

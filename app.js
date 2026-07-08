/* ==========================================================================
   PROVAKAR LEARNING MANAGEMENT ENGINE - CORE DATABASE v3.0
   ========================================================================== */

const DBConfig = {
  name: "ProvakarLMS_Storage",
  version: 1,
  stores: {
    subjects: "id",          // সাবজেক্ট ও চ্যাপ্টার ডিরেক্টরির জন্য
    current_affairs: "year", // বছর ও মাস ভিত্তিক কারেন্ট অ্যাফেয়ার্স
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

      // ২. কারেন্ট অ্যাফেয়ার্স বছর ও মাস ভিত্তিক মডেল
      await DatabaseEngine.put("current_affairs", {
        year: "2026",
        months: {
          "জানুয়ারি": [
            { id: "ca_26_j1", category: "পশ্চিমবঙ্গ", text: "২০২৬ সালের জানুয়ারি মাসে রাজ্যজুড়ে নতুন পঞ্চায়েত ডিজিটাল পোর্টাল চালু হয়েছে।" }
          ],
          "ফেব্রুয়ারি": [
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
    
    // সাইডবার মেনু ডাইনামিক রেন্ডারিং
    const menu = document.getElementById("sidebar-nav");
    if (menu) {
      menu.innerHTML = `
        <button onclick="ViewEngine.renderSubjects(); App.setActiveNav(this);" class="nav-btn active"><i class="fa-solid fa-book"></i> অল সাবজেক্ট</button>
        <button onclick="ViewEngine.renderCurrentAffairs(); App.setActiveNav(this);" class="nav-btn"><i class="fa-solid fa-bolt"></i> কারেন্ট অ্যাফেয়ার্স</button>
        <button onclick="MCQAdmin.renderAdminPanel(); App.setActiveNav(this);" class="nav-btn"><i class="fa-solid fa-plus-circle"></i> MCQ ম্যানেজার</button>
        <button onclick="CAAdmin.renderCAManager(); App.setActiveNav(this);" class="nav-btn"><i class="fa-solid fa-file-pen"></i> ওয়ানলাইনার এডমিন</button>
        <button onclick="DataHub.renderDataHub(); App.setActiveNav(this);" class="nav-btn"><i class="fa-solid fa-database"></i> ডাটা হাব</button>
      `;
    }
    
    // ডিফল্ট ভিউ লোড
    ViewEngine.renderSubjects();
    
    const dateDisplay = document.getElementById("current-date-node");
    if (dateDisplay) {
      dateDisplay.textContent = `আজ: ${new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}`;
    }
    
    await App.updateStats();
  } catch (error) {
    console.error("App startup crashed:", error);
  }
});

/* ==========================================================================
   PROVAKAR LEARNING MANAGEMENT ENGINE - VIEW ENGINE v3.0
   ========================================================================== */

const ViewEngine = {
  // অ্যাপের কারেন্ট স্টেট ট্র্যাক করার জন্য
  state: {
    activeSubjectId: null,
    activeChapterId: null
  },

  // ১. অল সাবজেক্ট ডিরেক্টরি রেন্ডার করার মেথড
  async renderSubjects() {
    this.state.activeSubjectId = null;
    this.state.activeChapterId = null;
    
    const mainView = document.getElementById("main-view");
    
    mainView.innerHTML = `
      <div class="space-y-4 animate-pulse">
        <div class="h-8 bg-slate-800 rounded w-1/4"></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="h-32 bg-slate-800 rounded-xl"></div>
          <div class="h-32 bg-slate-800 rounded-xl"></div>
          <div class="h-32 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    `;

    try {
      const subjects = await DatabaseEngine.getAll("subjects");

      if (subjects.length === 0) {
        mainView.innerHTML = `
          <div class="glass-card p-8 text-center rounded-2xl border border-dashed border-slate-700">
            <i class="fa-solid fa-folder-open text-4xl text-slate-500 mb-3 block"></i>
            <p class="text-slate-400">কোনো বিষয় খুঁজে পাওয়া যায়নি।</p>
            <p class="text-xs text-slate-500 mt-1">অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে বিষয় ও অধ্যায় যোগ করুন।</p>
          </div>
        `;
        return;
      }

      mainView.innerHTML = `
        <div class="view-container">
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-2"><i class="fa-solid fa-book text-[var(--accent)]"></i> অল সাবজেক্ট ডিরেক্টরি</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${subjects.map(subject => `
              <div onclick="ViewEngine.renderChapters('${subject.id}')" 
                   class="glass-card p-6 rounded-xl cursor-pointer hover:border-[var(--accent)] group">
                <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-[var(--accent)] mb-3 group-hover:bg-[var(--accent)] group-hover:text-slate-900 transition-all">
                  <i class="fa-solid fa-bookmark text-lg"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-200 mb-1 group-hover:text-[var(--accent)] transition-colors">${Utils.escapeHtml(subject.name)}</h3>
                <p class="text-xs text-text-secondary">${subject.chapters ? subject.chapters.length : 0} Ti অধ্যায় গুরুত্বপূর্ণ</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Failed to render subjects:", error);
      mainView.innerHTML = `<p class="text-vivid-red">ডিরেক্টরি লোড করতে সমস্যা হয়েছে।</p>`;
    }
  },

  // ২. সাবজেক্টে ক্লিক করার পর চ্যাপ্টার লিস্ট রেন্ডার করার মেথড
  async renderChapters(subjectId) {
    this.state.activeSubjectId = subjectId;
    const mainView = document.getElementById("main-view");

    try {
      const subject = await DatabaseEngine.get("subjects", subjectId);
      if (!subject) return;

      mainView.innerHTML = `
        <div class="view-container">
          <div class="mb-6">
            <button onclick="ViewEngine.renderSubjects()" class="btn-ghost text-xs py-1.5 px-3 flex items-center gap-2">
              <i class="fa-solid fa-arrow-left"></i> বিষয় তালিকায় ফিরে যান
            </button>
            <h2 class="text-3xl font-bold text-slate-100 mt-4">${Utils.escapeHtml(subject.name)}</h2>
            <p class="text-sm text-slate-400 mt-1">প্রস্তুতি নেওয়ার জন্য নিচের যেকোনো একটি অধ্যায় নির্বাচন করো:</p>
          </div>

          <div class="space-y-3">
            ${subject.chapters && subject.chapters.length > 0 ? subject.chapters.map((chapter, index) => `
              <div class="glass-card p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <div class="flex items-center gap-3 w-full sm:w-auto">
                  <div class="w-8 h-8 rounded-lg bg-slate-850 border border-[var(--border)] font-bold text-sm flex items-center justify-center text-[var(--accent)]">
                    ${index + 1}
                  </div>
                  <div>
                    <h4 class="font-semibold text-base text-slate-200">${Utils.escapeHtml(chapter.name)}</h4>
                    <p class="text-xs text-slate-400">মোট প্রশ্ন সংখ্যা: ${chapter.questions ? chapter.questions.length : 0}</p>
                  </div>
                </div>
                 
                <div class="flex gap-2 w-full sm:w-auto justify-end">
                  <button onclick="ViewEngine.startPreparation('${Utils.escapeHtml(subject.id)}', '${Utils.escapeHtml(chapter.id)}')" 
                          class="btn-primary text-xs py-2 px-4 flex-1 sm:flex-none flex items-center justify-center gap-1">
                    <i class="fa-solid fa-play text-xs"></i> পড়াশোনা শুরু করো
                  </button>
                </div>
              </div>
            `).join('') : `
              <div class="p-6 text-center text-slate-500 glass-card rounded-xl border-dashed">
                এই বিষয়ের অধীনে এখনো কোনো অধ্যায় যোগ করা হয়নি।
              </div>
            `}
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Failed to render chapters:", error);
      Utils.toast("অধ্যায় লোড করতে ব্যর্থ হয়েছে", "error");
    }
  },

  // ৩. চ্যাপ্টার সিলেক্ট করার পর মডাল পপআপের মাধ্যমে মোড নির্বাচন লজিক
  startPreparation(subjectId, chapterId) {
    this.state.activeChapterId = chapterId;
    Utils.toast("অধ্যায় লোড হচ্ছে...", "info");
    
    Utils.showModal("প্রস্তুতি মোড বেছে নিন", `
      <p class="text-slate-300 text-sm mb-4">আপনি এই অধ্যায়টি কীভাবে অনুশীলন করতে চান?</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onclick="Utils.closeModal(); ExamEngine.startStudy('${subjectId}', '${chapterId}')" class="btn-primary py-3 text-center flex items-center justify-center gap-2">
          <i class="fa-solid fa-book-open text-xs"></i> পড়াশোনা ও প্র্যাকটিস
        </button>
        <button onclick="Utils.closeModal(); ExamEngine.startMock('${subjectId}', '${chapterId}')" class="btn-ghost border-[var(--accent)] text-[var(--accent)] py-3 text-center hover:bg-[var(--accent)]/10 flex items-center justify-center gap-2">
          <i class="fa-solid fa-stopwatch text-xs"></i> লাইভ মক টেস্ট (CBT)
        </button>
      </div>
    `);
  }
};

window.ViewEngine = ViewEngine;

/* ==========================================================================
   PROVAKAR LEARNING MANAGEMENT ENGINE - CURRENT AFFAIRS ENGINE v3.0
   ========================================================================== */

Object.assign(ViewEngine, {
  async renderCurrentAffairs() {
    this.state.activeSubjectId = null;
    this.state.activeChapterId = null;
    
    const mainView = document.getElementById("main-view");
    
    mainView.innerHTML = `
      <div class="space-y-6 animate-pulse">
        <div class="h-8 bg-slate-800 rounded w-1/3"></div>
        <div class="h-40 bg-slate-800 rounded-2xl"></div>
      </div>
    `;

    try {
      const caData = await DatabaseEngine.getAll("current_affairs");

      if (caData.length === 0) {
        mainView.innerHTML = `
          <div class="glass-card p-8 text-center rounded-2xl border border-dashed border-slate-700">
            <i class="fa-solid fa-calendar-minus text-4xl text-slate-500 mb-3 block"></i>
            <p class="text-slate-400">কোনো কারেন্ট অ্যাফেয়ার্স ডাটা পাওয়া যায়নি।</p>
            <p class="text-xs text-slate-500 mt-1">অনুগ্রহ করে এডমিন প্যানেল থেকে বাল্ক আপলোড করুন।</p>
          </div>
        `;
        return;
      }

      mainView.innerHTML = `
        <div class="view-container">
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <i class="fa-solid fa-bolt text-[var(--accent)]"></i> কারেন্ট অ্যাফেয়ার্স ডিরেক্টরি
          </h2>
           
          <div class="space-y-6">
            ${caData.map(yearGroup => `
              <div class="glass-card p-6 rounded-2xl border border-[var(--border)] bg-slate-900/40">
                <div class="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <i class="fa-solid fa-calendar-days text-[var(--accent)]"></i>
                  <h3 class="text-xl font-bold text-slate-200">${Utils.escapeHtml(yearGroup.year)} সালের কারেন্ট অ্যাফেয়ার্স</h3>
                </div>
                 
                <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  ${Object.keys(yearGroup.months).map(month => `
                    <button onclick="ViewEngine.renderCAMonth('${Utils.escapeHtml(yearGroup.year)}', '${Utils.escapeHtml(month)}')" 
                            class="px-4 py-2.5 rounded-xl bg-slate-800/60 text-slate-300 text-sm font-semibold border border-transparent hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all text-center">
                      <i class="fa-regular fa-clock mr-1 text-xs opacity-70"></i> ${Utils.escapeHtml(month)}
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Failed to render current affairs:", error);
      mainView.innerHTML = `<p class="text-vivid-red">কারেন্ট অ্যাফেয়ার্স ডিরেক্টরি লোড করতে সমস্যা হয়েছে।</p>`;
    }
  },

  async renderCAMonth(year, month) {
    const mainView = document.getElementById("main-view");

    try {
      const yearData = await DatabaseEngine.get("current_affairs", year);
      if (!yearData) return;

      const items = yearData.months[month] || [];

      mainView.innerHTML = `
        <div class="view-container">
          <div class="mb-6">
            <button onclick="ViewEngine.renderCurrentAffairs()" class="btn-ghost text-xs py-1.5 px-3 flex items-center gap-2">
              <i class="fa-solid fa-arrow-left"></i> архив তালিকায় ফিরে যান
            </button>
            <h2 class="text-2xl font-bold text-slate-100 mt-4 flex items-center gap-2">
              <i class="fa-solid fa-calendar-check text-[var(--accent)]"></i> ${Utils.escapeHtml(year)} - ${Utils.escapeHtml(month)} এর কারেন্ট অ্যাফেয়ার্স
            </h2>
            <p class="text-xs text-slate-400 mt-1">মোট উপলব্ধ তথ্য: <span class="neon-text font-bold">${items.length}</span> টি ওয়ানলাইনার</p>
          </div>

          ${items.length > 0 ? `
            <div class="grid grid-cols-1 gap-3">
              ${items.map((item, index) => `
                <div class="glass-card p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all flex items-start gap-4">
                  <div class="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[var(--accent)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    ${index + 1}
                  </div>
                   
                  <div class="flex-1 min-w-0">
                    <div class="mb-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                        <i class="fa-solid fa-tags text-xs text-[var(--accent)] opacity-70 scale-90 mr-0.5"></i> ${Utils.escapeHtml(item.category)}
                      </span>
                    </div>
                    <p class="text-sm leading-relaxed text-slate-200 font-medium">${Utils.highlightOneliner(item.text)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-6 text-center text-slate-500 glass-card rounded-xl border-dashed">
              এই মাসের অধীনে এখনো কোনো ডেটা আপলোড করা হয়নি।
            </div>
          `}
        </div>
      `;
    } catch (error) {
      console.error("Failed to render CA month details:", error);
      Utils.toast("कন্টেন্ট লোড করতে সমস্যা হয়েছে", "error");
    }
  }
});

/* ==========================================================================
   PROVAKAR LEARNING MANAGEMENT ENGINE - EXAM & STUDY ENGINE v3.0
   ========================================================================== */

const ExamEngine = {
  currentExam: {
    questions: [],
    userAnswers: {},
    timer: null,
    timeRemaining: 0,
    isMock: false
  },

  async startStudy(subjectId, chapterId) {
    const subject = await DatabaseEngine.get("subjects", subjectId);
    const chapter = subject.chapters.find(c => c.id === chapterId);
    
    if (!chapter.questions || chapter.questions.length === 0) {
      Utils.toast("এই অধ্যায়ে এখনো কোনো প্রশ্ন নেই!", "warning");
      return;
    }

    this.currentExam = { questions: chapter.questions, userAnswers: {}, isMock: false, isSubmitted: false };
    this.renderExamView(0);
  },

  async startMock(subjectId, chapterId) {
    const subject = await DatabaseEngine.get("subjects", subjectId);
    const chapter = subject.chapters.find(c => c.id === chapterId);
    
    if (!chapter.questions || chapter.questions.length === 0) {
      Utils.toast("এই অধ্যায়ে এখনো কোনো প্রশ্ন নেই!", "warning");
      return;
    }

    this.currentExam = { 
      questions: chapter.questions, 
      userAnswers: {}, 
      isMock: true, 
      isSubmitted: false,
      timeRemaining: chapter.questions.length * 60
    };
    
    this.timer = setInterval(() => {
      this.currentExam.timeRemaining--;
      const timerEl = document.getElementById("timer-display");
      if (timerEl) {
        timerEl.textContent = Utils.formatTime(this.currentExam.timeRemaining);
      }
      if (this.currentExam.timeRemaining <= 0) this.submitExam();
    }, 1000);

    this.renderExamView(0);
  },

  renderExamView(qIndex) {
    const q = this.currentExam.questions[qIndex];
    const mainView = document.getElementById("main-view");
    
    mainView.innerHTML = `
      <div class="max-w-3xl mx-auto view-container">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg">${this.currentExam.isMock ? 'মক টেস্ট' : 'প্র্যাকটিস মোড'}</h3>
          ${this.currentExam.isMock ? `<div id="timer-display" class="bg-red-900/30 text-red-500 font-mono px-3 py-1 rounded-lg">${Utils.formatTime(this.currentExam.timeRemaining)}</div>` : ''}
        </div>

        <div class="glass-card p-6 rounded-2xl mb-6">
          <p class="text-lg mb-6">${Utils.escapeHtml(q.question)}</p>
          <div class="space-y-3">
            ${['A', 'B', 'C', 'D'].map(opt => `
              <button onclick="ExamEngine.selectOption('${opt}')" 
                      class="w-full text-left p-4 rounded-xl border border-slate-700 hover:border-[var(--accent)] transition-all ${this.currentExam.userAnswers[qIndex] === opt ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-slate-800/50'}">
                <span class="font-bold mr-3">${opt}.</span> ${Utils.escapeHtml(q['opt' + opt])}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="flex justify-between">
          <button onclick="ExamEngine.navigate(${qIndex - 1})" ${qIndex === 0 ? 'disabled' : ''} class="btn-ghost">পূর্ববর্তী</button>
          ${qIndex < this.currentExam.questions.length - 1 ? 
            `<button onclick="ExamEngine.navigate(${qIndex + 1})" class="btn-primary">পরবর্তী</button>` :
            `<button onclick="ExamEngine.submitExam()" class="btn-primary bg-emerald-600">সাবমিট</button>`
          }
        </div>
      </div>
    `;
  },

  selectOption(opt) {
    const qIndex = this.getCurrentIndex();
    this.currentExam.userAnswers[qIndex] = opt;
    this.renderExamView(qIndex);
  },

  submitExam() {
    clearInterval(this.timer);
    let score = 0;
    this.currentExam.questions.forEach((q, i) => {
      if (this.currentExam.userAnswers[i] === q.correct) score++;
    });

    const mainView = document.getElementById("main-view");
    mainView.innerHTML = `
      <div class="max-w-2xl mx-auto glass-card p-8 rounded-2xl text-center">
        <h2 class="text-3xl font-bold mb-4">পরীক্ষা সম্পন্ন!</h2>
        <div class="text-6xl font-bold text-[var(--accent)] mb-6">${score}/${this.currentExam.questions.length}</div>
        <button onclick="ViewEngine.renderSubjects()" class="btn-primary">ড্যাশবোর্ডে ফিরে যান</button>
      </div>
    `;
  }
};

/* ==========================================================================
   PROVAKAR LEARNING MANAGEMENT ENGINE - ADMIN PANEL & DATA ENGINE v3.0
   ========================================================================== */

ExamEngine.getCurrentIndex = function() {
  return this._lastIndex || 0;
};

ExamEngine.navigate = function(idx) {
  this._lastIndex = idx;
  this.renderExamView(idx);
};

/* ---------- MCQ & Subject Admin Controller ---------- */
const MCQAdmin = {
  async renderAdminPanel() {
    const mainView = document.getElementById("main-view");
    const subjects = await DatabaseEngine.getAll("subjects");

    mainView.innerHTML = `
      <div class="max-w-4xl mx-auto view-container">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
          <i class="fa-solid fa-sliders text-[var(--accent)]"></i> ম্যানেজমেন্ট ও এডমিন প্যানেল
        </h2>

        <div class="glass-card p-5 rounded-2xl mb-6">
          <h3 class="font-bold text-lg mb-4 flex items-center gap-2 text-slate-200">
            <i class="fa-solid fa-folder-plus text-[var(--accent)]"></i> নতুন বিষয় (Subject) তৈরি করুন
          </h3>
          <div class="flex gap-3">
            <input type="text" id="new-subject-name" placeholder="যেমন: ভারতের ভূগোল, পাটিগণিত" class="input-field" />
            <button onclick="MCQAdmin.createSubject()" class="btn-primary whitespace-nowrap">বিষয় তৈরি করুন</button>
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl mb-6">
          <h3 class="font-bold text-lg mb-4 flex items-center gap-2 text-slate-200">
            <i class="fa-solid fa-book-medical text-[var(--accent)]"></i> অধ্যায় ও আনলিমিটেড প্রশ্ন যোগ করুন
          </h3>
          <form id="admin-q-form" onsubmit="MCQAdmin.handleQuestionSubmit(event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-slate-400 mb-1 block">বিষয় নির্বাচন করুন *</label>
                <select id="admin-select-subject" onchange="MCQAdmin.updateChapterDropdown()" required class="input-field">
                  <option value="">বিষয় বেছে নিন</option>
                  ${subjects.map(s => `<option value="${Utils.escapeHtml(s.id)}">${Utils.escapeHtml(s.name)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-400 mb-1 block">অধ্যায়/চ্যাপ্টার নির্বাচন বা টাইপ করুন *</label>
                <input type="text" id="admin-chapter-name" placeholder="যেমন: সিন্ধু সভ্যতা বা নতুন চ্যাপ্টার" list="existing-chapters" required class="input-field" />
                <datalist id="existing-chapters"></datalist>
              </div>
            </div>

            <div>
              <label class="text-xs text-slate-400 mb-1 block">প্রশ্ন (Question) *</label>
              <textarea id="admin-question" required rows="2" placeholder="প্রশ্ন লিখুন..." class="input-field resize-none"></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="text-xs text-slate-400 mb-1 block">Option A *</label><input type="text" id="admin-optA" required class="input-field" /></div>
              <div><label class="text-xs text-slate-400 mb-1 block">Option B *</label><input type="text" id="admin-optB" required class="input-field" /></div>
              <div><label class="text-xs text-slate-400 mb-1 block">Option C *</label><input type="text" id="admin-optC" required class="input-field" /></div>
              <div><label class="text-xs text-slate-400 mb-1 block">Option D *</label><input type="text" id="admin-optD" required class="input-field" /></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-slate-400 mb-1 block">সঠিক উত্তর *</label>
                <select id="admin-correct" required class="input-field">
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-400 mb-1 block">ব্যাখ্যা ও বিশ্লেষণ (ঐচ্ছিক)</label>
                <input type="text" id="admin-explanation" placeholder="সঠিক উত্তরের বিশদ বিশ্লেষণ..." class="input-field" />
              </div>
            </div>

            <div class="flex justify-end">
              <button type="submit" class="btn-primary bg-cyan-600"><i class="fa-solid fa-plus mr-1"></i> ডাটাবেসে প্রশ্ন সেভ করুন</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async createSubject() {
    const nameInput = document.getElementById("new-subject-name");
    const name = nameInput.value.trim();
    if (!name) { Utils.toast("বিষয়ের নাম লিখুন", "error"); return; }

    const id = "sub_" + Date.now();
    await DatabaseEngine.put("subjects", { id, name, chapters: [] });
    nameInput.value = "";
    Utils.toast("নতুন বিষয় সফলভাবে তৈরি হয়েছে", "success");
    this.renderAdminPanel();
    App.updateStats();
  },

  async updateChapterDropdown() {
    const subId = document.getElementById("admin-select-subject").value;
    const datalist = document.getElementById("existing-chapters");
    if (!datalist) return;
    datalist.innerHTML = "";
    if (!subId) return;

    const subject = await DatabaseEngine.get("subjects", subId);
    if (subject && subject.chapters) {
      datalist.innerHTML = subject.chapters.map(ch => `<option value="${Utils.escapeHtml(ch.name)}">`).join('');
    }
  },

  async handleQuestionSubmit(e) {
    e.preventDefault();
    const subId = document.getElementById("admin-select-subject").value;
    const chapterName = document.getElementById("admin-chapter-name").value.trim();
    
    const questionData = {
      id: "q_" + Date.now(),
      question: document.getElementById("admin-question").value.trim(),
      optA: document.getElementById("admin-optA").value.trim(),
      optB: document.getElementById("admin-optB").value.trim(),
      optC: document.getElementById("admin-optC").value.trim(),
      optD: document.getElementById("admin-optD").value.trim(),
      correct: document.getElementById("admin-correct").value,
      explanation: document.getElementById("admin-explanation").value.trim()
    };

    const subject = await DatabaseEngine.get("subjects", subId);
    let chapter = subject.chapters.find(ch => ch.name.toLowerCase() === chapterName.toLowerCase());

    if (!chapter) {
      chapter = { id: "ch_" + Date.now(), name: chapterName, questions: [] };
      subject.chapters.push(chapter);
    }

    chapter.questions.push(questionData);
    await DatabaseEngine.put("subjects", subject);
    
    document.getElementById("admin-question").value = "";
    document.getElementById("admin-optA").value = "";
    document.getElementById("admin-optB").value = "";
    document.getElementById("admin-optC").value = "";
    document.getElementById("admin-optD").value = "";
    document.getElementById("admin-explanation").value = "";
    
    Utils.toast("প্রশ্ন সফলভাবে ডাটাবেসে সেভ হয়েছে", "success");
    App.updateStats();
  }
};

/* ---------- Current Affairs Admin Controller ---------- */
const CAAdmin = {
  renderCAManager() {
    const mainView = document.getElementById("main-view");
    mainView.innerHTML = `
      <div class="max-w-4xl mx-auto view-container">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
          <i class="fa-solid fa-calendar-plus text-[var(--accent)]"></i> কারেন্ট অ্যাফেয়ার্স ম্যানেজার
        </h2>

        <div class="glass-card p-5 rounded-2xl mb-6">
          <h3 class="font-bold text-lg mb-4 text-slate-200">বাল্ক ওয়ানলাইনার আপলোড</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label class="text-xs text-slate-400 block mb-1">বছর (Year) *</label>
              <input type="number" id="ca-year" value="${new Date().getFullYear()}" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-slate-400 block mb-1">মাস (Month) *</label>
              <select id="ca-month" class="input-field">
                <option value="জানুয়ারি">জানুয়ারি</option><option value="ফেব্রুয়ারি">ফেব্রুয়ারি</option>
                <option value="মার্চ">মার্চ</option><option value="এপ্রিল">এপ্রিল</option>
                <option value="মে">মে</option><option value="জুন">জুন</option>
                <option value="জুলাই">জুলাই</option><option value="আগস্ট">আগস্ট</option>
                <option value="সেপ্টেম্বর">সেপ্টেম্বর</option><option value="অক্টোবর">অক্টোবর</option>
                <option value="নভেম্বর">নভেম্বর</option><option value="ডিসেম্বর">ডিসেম্বর</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-400 block mb-1">ক্যাটাগরি/ট্যাগ *</label>
              <input type="text" id="ca-category" placeholder="যেমন: পশ্চিমবঙ্গ, ক্রীড়া, জাতীয়" class="input-field" />
            </div>
          </div>

          <div class="mb-4">
            <label class="text-xs text-slate-400 block mb-1">ওয়ানলাইনার কন্টেন্ট (প্রতি লাইনে একটি তথ্য) *</label>
            <textarea id="ca-bulk-text" rows="6" placeholder="লাইন ১: এখানে প্রথম তথ্যটি লিখুন...&#10;লাইন ২: এখানে দ্বিতীয় তথ্যটি লিখুন..." class="input-field"></textarea>
          </div>

          <div class="flex justify-end gap-2">
            <button onclick="CAAdmin.clearForm()" class="btn-ghost">ক্লিয়ার</button>
            <button onclick="CAAdmin.submitBulkCA()" class="btn-primary">আপলোড করুন</button>
          </div>
        </div>
      </div>
    `;
  },

  async submitBulkCA() {
    const year = document.getElementById("ca-year").value.trim();
    const month = document.getElementById("ca-month").value;
    const category = document.getElementById("ca-category").value.trim();
    const rawText = document.getElementById("ca-bulk-text").value.trim();

    if (!year || !category || !rawText) { Utils.toast("সব ঘর পূরণ করুন", "error"); return; }

    const lines = rawText.split("\n").map(l => l.trim()).filter(l => l);
    let yearGroup = await DatabaseEngine.get("current_affairs", year);

    if (!yearGroup) {
      yearGroup = { year: year, months: {} };
    }
    if (!yearGroup.months[month]) {
      yearGroup.months[month] = [];
    }

    lines.forEach(line => {
      yearGroup.months[month].push({
        id: "ca_" + Date.now() + Math.random().toString(36).substring(2,5),
        category: category,
        text: line
      });
    });

    await DatabaseEngine.put("current_affairs", yearGroup);
    Utils.toast(`${lines.length} টি ওয়ানলাইনার ডেটা সেভ হয়েছে`, "success");
    this.clearForm();
    App.updateStats();
  },

  clearForm() {
    document.getElementById("ca-bulk-text").value = "";
  }
};

/* ---------- Data Hub & Settings System Backup ---------- */
const DataHub = {
  renderDataHub() {
    const mainView = document.getElementById("main-view");
    mainView.innerHTML = `
      <div class="max-w-4xl mx-auto view-container">
        <h2 class="text-2xl font-bold mb-6"><i class="fa-solid fa-database text-[var(--accent)]"></i> এন্টারপ্রাইজ ডাটা হাব</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="glass-card p-6 rounded-2xl text-center">
            <i class="fa-solid fa-cloud-arrow-down text-4xl text-emerald-500 mb-3"></i>
            <h3 class="font-bold text-lg mb-2">ডাটা ব্যাকআপ এক্সপোর্ট</h3>
            <p class="text-sm text-slate-400 mb-4">আপনার সমস্ত নেস্টেড ডাটাবেস একটি একক JSON ফাইল হিসেবে নামিয়ে রাখুন।</p>
            <button onclick="DataHub.exportAllData()" class="btn-primary w-full bg-emerald-600">JSON এক্সপোর্ট</button>
          </div>
          <div class="glass-card p-6 rounded-2xl text-center">
            <i class="fa-solid fa-cloud-arrow-up text-4xl text-cyan-500 mb-3"></i>
            <h3 class="font-bold text-lg mb-2">ডাটা রিস্টোর ইম্পোর্ট</h3>
            <p class="text-sm text-slate-400 mb-4">পূর্বে ব্যাকআপ নেওয়া JSON ফাইলটি আপলোড করে পুরো ডাটাবেস রিস্টোর করুন।</p>
            <label class="btn-primary w-full flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-file-import mr-1"></i> ফাইল সিলেক্ট করুন
              <input type="file" accept=".json" onchange="DataHub.importAllData(event)" class="hidden" />
            </label>
          </div>
        </div>
      </div>
    `;
  },

  async exportAllData() {
    const subjects = await DatabaseEngine.getAll("subjects");
    const ca = await DatabaseEngine.getAll("current_affairs");
    const backup = { version: "3.0", subjects, current_affairs: ca };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `provakar_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    Utils.toast("ডাটাবেস সফলভাবে এক্সপোর্ট হয়েছে", "success");
  },

  async importAllData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.subjects) {
          for (let sub of data.subjects) await DatabaseEngine.put("subjects", sub);
        }
        if (data.current_affairs) {
          for (let ca of data.current_affairs) await DatabaseEngine.put("current_affairs", ca);
        }
        Utils.toast("ডাটাবেস সফলভাবে রিস্টোর হয়েছে", "success");
        ViewEngine.renderSubjects();
        App.updateStats();
      } catch (err) {
        Utils.toast("ভুল ফাইল ফরম্যাট!", "error");
      }
    };
    reader.readAsText(file);
  }
};

/* ---------- App Stats Counter Optimization ---------- */
App.updateStats = async function() {
  const tq = document.getElementById("stat-total-q");
  const to = document.getElementById("stat-total-o");
  
  const subjects = await DatabaseEngine.getAll("subjects");
  const ca = await DatabaseEngine.getAll("current_affairs");
  
  let totalQuestions = 0;
  subjects.forEach(s => {
    if(s.chapters) s.chapters.forEach(ch => { if(ch.questions) totalQuestions += ch.questions.length; });
  });

  let totalOneliners = 0;
  ca.forEach(yearGroup => {
    Object.values(yearGroup.months).forEach(mList => totalOneliners += mList.length);
  });

  if (tq) tq.textContent = totalQuestions;
  if (to) to.textContent = totalOneliners;
};

// সাইডবার ডাইনামিক রুট মাউন্টিং ফিক্স
document.addEventListener("DOMContentLoaded", () => {
  const navMenu = document.getElementById("sidebar-nav");
  if(navMenu) {
    navMenu.innerHTML = `
      <button onclick="ViewEngine.renderSubjects(); App.setActiveNav(this);" class="nav-btn active"><i class="fa-solid fa-book"></i> অল সাবজেক্ট</button>
      <button onclick="ViewEngine.renderCurrentAffairs(); App.setActiveNav(this);" class="nav-btn"><i class="fa-solid fa-bolt"></i> কারেন্ট অ্যাফেয়ার্স</button>
      <button onclick="MCQAdmin.renderAdminPanel(); App.setActiveNav(this);" class="nav-btn"><i class="fa-solid fa-plus-circle"></i> MCQ ম্যানেজার</button>
      <button onclick="CAAdmin.renderCAManager(); App.setActiveNav(this);" class="nav-btn"><i class="fa-solid fa-file-pen"></i> ওয়ানলাইনার এডমিন</button>
      <button onclick="DataHub.renderDataHub(); App.setActiveNav(this);" class="nav-btn"><i class="fa-solid fa-database"></i> ডাটা হাব</button>
    `;
  }
});

App.setActiveNav = function(btn) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
};

// এক্সপোজ গ্লোবাল হ্যান্ডলারস
window.MCQAdmin = MCQAdmin;
window.CAAdmin = CAAdmin;
window.DataHub = DataHub;

/* ==========================================================================
   PROVAKAR LEARNING MANAGEMENT ENGINE - SETTINGS & GLOBAL BOOT v3.0
   ========================================================================== */

const Settings = {
  // ১. সেটিংস প্যানেল ওপেন করা
  open() {
    const panel = document.getElementById("settings-panel");
    if (panel) {
      panel.classList.add("open");
      this.renderSettingsBody();
    }
  },

  // ২. সেটিংস প্যানেল বন্ধ করা
  close() {
    const panel = document.getElementById("settings-panel");
    if (panel) panel.classList.remove("open");
  },

  // ৩. সেটিংসের ভেতরের ইন্টারফেস রেন্ডার করা
  renderSettingsBody() {
    const body = document.getElementById("settings-body");
    if (!body) return;

    body.innerHTML = `
      <div class="border-b border-slate-800 pb-4">
        <h4 class="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-300">
          <i class="fa-solid fa-text-height text-[var(--accent)]"></i> টেক্সট সাইজ (Text Size)
        </h4>
        <div class="grid grid-cols-3 gap-2">
          ${['small', 'medium', 'large'].map(size => `
            <button onclick="Settings.setTextSize('${size}')" 
                    class="chip justify-center py-2 ${State.data.textSize === size ? 'active' : ''}">
              ${size === 'small' ? 'ছোট' : size === 'medium' ? 'মাঝারি' : 'বড়'}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="border-b border-slate-800 pb-4">
        <h4 class="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-300">
          <i class="fa-solid fa-palette text-[var(--accent)]"></i> ডাইনামিক থিম (Themes)
        </h4>
        <div class="space-y-2">
          ${[
            { id: 'cyberpunk-dark', name: 'Cyberpunk Dark', desc: 'নিওন সায়ান ও ডার্ক স্লেট', colors: 'from-cyan-500 to-blue-600' },
            { id: 'midnight-blue', name: 'Midnight Blue', desc: 'গভীর নীল ও রয়্যাল টেক্সচার', colors: 'from-blue-700 to-indigo-900' },
            { id: 'stealth-black', name: 'Stealth Black', desc: 'পিওর ব্ল্যাক ও এমারেল্ড গ্রিন', colors: 'from-zinc-800 to-black' }
          ].map(theme => `
            <button onclick="Settings.setTheme('${theme.id}')" 
                    class="w-full p-3 rounded-xl flex items-center gap-3 border transition-all ${State.data.currentTheme === theme.id ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br ${theme.colors} flex-shrink-0"></div>
              <div class="flex-1 text-left">
                <div class="font-bold text-sm text-slate-200">${theme.name}</div>
                <div class="text-xs text-slate-400">${theme.desc}</div>
              </div>
              ${State.data.currentTheme === theme.id ? `<i class="fa-solid fa-circle-check text-[var(--accent)]"></i>` : ''}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="pt-2">
        <div class="glass-card p-4 rounded-xl bg-slate-900/40">
          <div class="flex items-center gap-3 mb-2">
            <i class="fa-solid fa-shield-halved text-[var(--accent)] text-lg"></i>
            <div class="text-xs text-slate-400">
              <p class="font-bold text-slate-300">Provakar Hub Engine</p>
              <p>ভার্সন ৩.০ (এন্টারপ্রাইজ গ্রেড)</p>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            এটি একটি ১০০% ক্লায়েন্ট-সাইড সুরক্ষিত সিঙ্গেল পেজ অ্যাপ্লিকেশন (SPA)। আপনার সমস্ত ডেটা ব্রাউজারের নিজস্ব IndexedDB ডাটাবেসে সুরক্ষিত থাকে।
          </p>
        </div>
      </div>
    `;
  },

  // ৪. গ্লোবাল ফন্ট সাইজ সেট করা
  setTextSize(size) {
    State.update({ textSize: size });
    document.body.setAttribute("data-text-size", size);
    this.renderSettingsBody();
    Utils.toast("টেক্সট সাইজ আপডেট করা হয়েছে", "info");
  },

  // ৫. গ্লোবাল থিম পরিবর্তন করা
  setTheme(theme) {
    State.update({ currentTheme: theme });
    document.body.setAttribute("data-theme", theme);
    this.renderSettingsBody();
    Utils.toast("থিম পরিবর্তন সফল হয়েছে", "success");
  }
};

/* ==========================================================================
   FINAL CORE ENGINE APP BOOTSTRAP (The Ultimate Symphony)
   ========================================================================== */

const AppBootstrap = {
  async run() {
    try {
      State.load();
      await DatabaseEngine.init();
      await InitialDataSeeder.run();

      document.body.setAttribute("data-theme", State.data.currentTheme || "cyberpunk-dark");
      document.body.setAttribute("data-text-size", State.data.textSize || "medium");

      await App.updateStats();
      ViewEngine.renderSubjects();

      const dateDisplay = document.getElementById("current-date-node");
      if (dateDisplay) {
        dateDisplay.textContent = `আজ: ${new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}`;
      }

      console.log("PROVAKAR HUB SYSTEM v3.0 BOOTED SUCCESSFULLY.");
    } catch (error) {
      console.error("Critical System Crash on Startup:", error);
      document.getElementById("main-view").innerHTML = `
        <div class="p-6 max-w-md mx-auto text-center glass-card border border-red-500 rounded-2xl">
          <i class="fa-solid fa-circle-exclamation text-4xl text-red-500 mb-3"></i>
          <h3 class="text-xl font-bold text-red-400">সিস্টেম বুট ক্র্যাশ!</h3>
          <p class="text-sm text-slate-400 mt-1">আপনার ব্রাউজারটি IndexedDB সাপোর্ট করছে না অথবা স্টোরেজ ব্লকড হয়ে আছে।</p>
        </div>
      `;
    }
  }
};

document.addEventListener("DOMContentLoaded", AppBootstrap.run);
window.Settings = Settings;

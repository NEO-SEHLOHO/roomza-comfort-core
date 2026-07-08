const topbar = document.querySelector(".topbar");
const navToggle = document.querySelector(".nav-toggle");
const searchForm = document.querySelector("[data-search-form]");
const keywordInput = document.querySelector("[data-keyword]");
const budgetSelect = document.querySelector("[data-budget]");
const typeSelect = document.querySelector("[data-type]");
const sortSelect = document.querySelector("[data-sort]");
const resetButton = document.querySelector("[data-reset]");
const authButton = document.querySelector("[data-auth-button]");
const userMenu = document.querySelector("[data-user-menu]");
const applicationCountBadge = document.querySelector("[data-application-count]");
const logoutButton = document.querySelector("[data-logout]");
const resultCount = document.querySelector("[data-result-count]");
const emptyState = document.querySelector("[data-empty]");
const listingStack = document.querySelector(".listing-stack");
const listings = Array.from(document.querySelectorAll("[data-listing]"));
const checkboxFilters = Array.from(document.querySelectorAll("[data-checkbox]"));
const quickFilters = Array.from(document.querySelectorAll("[data-quick]"));
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalEyebrow = document.querySelector("[data-modal-eyebrow]");
const modalCopy = document.querySelector("[data-modal-copy]");
const modalNote = document.querySelector("[data-modal-note]");
const modalSubmit = document.querySelector("[data-modal-submit]");
const modalForm = document.querySelector("[data-modal-form]");
const modalNameField = document.querySelector("[data-name-field]");
const modalEmailField = document.querySelector("[data-email-field]");
const modalPasswordField = document.querySelector("[data-password-field]");
const modalPhoneField = document.querySelector("[data-phone-field]");
const modalStudentIdField = document.querySelector("[data-student-id-field]");
const modalStudentNumberField = document.querySelector("[data-student-number-field]");
const modalGenderField = document.querySelector("[data-gender-field]");
const modalFundingField = document.querySelector("[data-funding-field]");
const modalNsfasField = document.querySelector("[data-nsfas-field]");
const modalBursaryField = document.querySelector("[data-bursary-field]");
const fundingSelect = document.querySelector("[data-funding-select]");
const authSwitch = document.querySelector("[data-auth-switch]");
const authSwitchText = document.querySelector("[data-auth-switch-text]");
const authToggle = document.querySelector("[data-auth-toggle]");
const toast = document.querySelector("[data-toast]");

let activeAction = "enquiry";
let activeListing = "";
let authMode = "login";
let signedInUser = null;
let toastTimer;
let lastScrollY = window.scrollY;
let applicationCountRequest = 0;
let authWatchAttempts = 0;

const demoStoreKey = "resza_demo_store_v1";
const demoSessionKey = "resza_demo_session_v1";

const defaultModalNote =
  "ResZa will never ask you to pay a deposit before you have spoken to the property contact.";

const modalStates = {
  enquiry: {
    eyebrow: "Student enquiry",
    title: "Enquire about this room",
    body: "Send your details and the accommodation team can confirm availability and next steps.",
    submit: "Send enquiry",
  },
  application: {
    eyebrow: "Residence application",
    title: "Apply for this residence",
    body: "Send your details for review. ResZa will save the application so the residence team can follow up from the admin side.",
    submit: "Submit application",
    note: "You can ask questions before paying anything. ResZa will not ask you to pay a deposit before speaking to the property contact.",
  },
  details: {
    eyebrow: "Room details",
    title: "Room details",
    body: "Send a quick request and the accommodation contact can share the full address, viewing times, deposit notes, and next steps.",
    submit: "Continue",
  },
  login: {
    eyebrow: "Student account",
    title: "Login to your account",
    body: "Use your email and password to continue.",
    submit: "Login",
    note: "Login only needs your email and password.",
  },
  register: {
    eyebrow: "Create account",
    title: "Create your student account",
    body: "Add your details once so enquiries and room updates can reach you.",
    submit: "Create account",
    note: "Registration needs your name and phone number so accommodation teams can contact you.",
  },
  list: {
    eyebrow: "Property owner",
    title: "List a student room",
    body: "Send the room details, rent, photos, and house rules so the listing can be reviewed.",
    submit: "Start listing",
  },
};

function listingData(card) {
  return {
    title: card.dataset.title || "",
    area: card.dataset.area || "",
    price: Number(card.dataset.price || 0),
    type: card.dataset.type || "",
    distance: Number(card.dataset.distance || 99),
    verified: card.dataset.verified === "true",
    wifi: card.dataset.wifi === "true",
    furnished: card.dataset.furnished === "true",
    laundry: card.dataset.laundry === "true",
    available: card.dataset.available === "true",
    walkable: card.dataset.walkable === "true",
  };
}

function activeCheckboxKeys() {
  return checkboxFilters
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.dataset.checkbox);
}

function matchesSearch(card) {
  const data = listingData(card);
  const keyword = (keywordInput?.value || "").trim().toLowerCase();
  const budget = Number(budgetSelect?.value || 99999);
  const type = typeSelect?.value || "all";
  const activeChecks = activeCheckboxKeys();

  const keywordMatch =
    !keyword ||
    `${data.title} ${data.area} ${data.type}`.toLowerCase().includes(keyword);
  const budgetMatch = data.price <= budget;
  const typeMatch = type === "all" || data.type === type;
  const checksMatch = activeChecks.every((key) => data[key]);

  return keywordMatch && budgetMatch && typeMatch && checksMatch;
}

function sortListings(visibleCards) {
  const sort = sortSelect?.value || "recommended";
  const sorted = [...visibleCards];

  if (sort === "price-low") {
    sorted.sort((a, b) => listingData(a).price - listingData(b).price);
  }

  if (sort === "distance") {
    sorted.sort((a, b) => listingData(a).distance - listingData(b).distance);
  }

  if (sort === "recommended") {
    sorted.sort((a, b) => {
      const first = listingData(a);
      const second = listingData(b);
      return Number(second.verified) - Number(first.verified) || first.distance - second.distance;
    });
  }

  return sorted;
}

function applyFilters() {
  const visible = listings.filter(matchesSearch);
  const sortedVisible = sortListings(visible);

  listings.forEach((card) => card.classList.add("is-hidden"));
  sortedVisible.forEach((card) => {
    card.classList.remove("is-hidden");
    listingStack?.appendChild(card);
  });

  if (resultCount) resultCount.textContent = String(sortedVisible.length);
  if (emptyState) emptyState.hidden = sortedVisible.length > 0;
}

function setQuickFilter(key, isActive) {
  const checkbox = checkboxFilters.find((item) => item.dataset.checkbox === key);
  if (!checkbox) return;
  checkbox.checked = isActive;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3800);
}

function readDemoStore() {
  try {
    return JSON.parse(window.localStorage.getItem(demoStoreKey)) || { users: {}, collections: {} };
  } catch (error) {
    console.warn("Could not read local demo store.", error);
    return { users: {}, collections: {} };
  }
}

function writeDemoStore(store) {
  try {
    window.localStorage.setItem(demoStoreKey, JSON.stringify(store));
  } catch (error) {
    console.warn("Could not write local demo store.", error);
  }
}

function demoUidForEmail(email) {
  const safeEmail = String(email || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `demo_${safeEmail || "user"}`;
}

function demoId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function localTimestamp() {
  return new Date().toISOString();
}

function localSessionUser() {
  try {
    return JSON.parse(window.localStorage.getItem(demoSessionKey)) || null;
  } catch (error) {
    console.warn("Could not read local demo session.", error);
    return null;
  }
}

function setLocalSessionUser(user) {
  window.localStorage.setItem(demoSessionKey, JSON.stringify(user));
}

function clearLocalSessionUser() {
  window.localStorage.removeItem(demoSessionKey);
}

function saveDemoDocument(collectionName, payload) {
  const store = readDemoStore();
  const id = demoId(collectionName);
  const doc = {
    ...payload,
    id,
    source: payload.source || "resza-website-demo",
    createdAt: payload.createdAt || localTimestamp(),
  };

  if (!store.collections) store.collections = {};
  if (!Array.isArray(store.collections[collectionName])) {
    store.collections[collectionName] = [];
  }

  store.collections[collectionName].push(doc);
  writeDemoStore(store);
  console.debug(`Saved ${collectionName} locally because Firebase is not configured.`, { id });

  return Promise.resolve({ id, local: true });
}

function countLocalApplications(user) {
  if (!user) return 0;

  const store = readDemoStore();
  const applications = store.collections?.residence_applications || [];

  return applications.filter((application) => {
    return (
      (user.uid && application.userId === user.uid) ||
      (user.email && application.email === user.email)
    );
  }).length;
}

function saveLocalUserProfile(user, updates = {}) {
  const store = readDemoStore();
  const email = user?.email || "";
  if (!email) return;

  if (!store.users) store.users = {};
  store.users[email] = {
    ...(store.users[email] || {}),
    ...user,
    ...updates,
    updatedAt: localTimestamp(),
  };
  writeDemoStore(store);
}

function userLabel(user) {
  if (!user) return "";
  if (user.displayName) return user.displayName.split(" ")[0];
  if (user.email) return user.email.split("@")[0];
  return "Account";
}

function setApplicationCount(count) {
  if (!applicationCountBadge) return;

  applicationCountBadge.hidden = false;
  applicationCountBadge.textContent = `${count} ${count === 1 ? "application" : "applications"}`;
}

function hideApplicationCount() {
  if (!applicationCountBadge) return;

  applicationCountBadge.hidden = true;
  applicationCountBadge.textContent = "0 applications";
}

async function addApplicationQueryCount(query, ids, label) {
  try {
    const snapshot = await query.get();
    snapshot.docs.forEach((doc) => ids.add(doc.id));
    console.debug(`Application count ${label} query returned ${snapshot.docs.length} documents.`);
    return true;
  } catch (error) {
    console.warn(`Could not count applications by ${label}.`, error);
    return false;
  }
}

async function loadApplicationCount(user) {
  const requestId = ++applicationCountRequest;

  if (!user) {
    hideApplicationCount();
    return;
  }

  const services = firebaseServices();
  if (!services?.db) {
    setApplicationCount(countLocalApplications(user));
    return;
  }

  if (applicationCountBadge) {
    applicationCountBadge.hidden = false;
    applicationCountBadge.textContent = "Checking applications";
  }

  const ids = new Set();
  const baseRef = services.db.collection("residence_applications");
  let successfulQueries = 0;

  if (user.uid) {
    const ok = await addApplicationQueryCount(baseRef.where("userId", "==", user.uid), ids, "userId");
    successfulQueries += ok ? 1 : 0;
  }

  if (user.email) {
    const ok = await addApplicationQueryCount(baseRef.where("email", "==", user.email), ids, "email");
    successfulQueries += ok ? 1 : 0;
  }

  if (requestId !== applicationCountRequest) return;

  if (successfulQueries === 0) {
    hideApplicationCount();
    return;
  }

  setApplicationCount(ids.size);
}

function updateAuthHeader(user) {
  const isSignedIn = Boolean(user);
  signedInUser = user || null;

  if (authButton) authButton.hidden = isSignedIn;
  if (userMenu) {
    userMenu.hidden = !isSignedIn;
    userMenu.textContent = isSignedIn ? `Hi, ${userLabel(user)}` : "";
    userMenu.title = user?.email || "";
  }
  if (logoutButton) logoutButton.hidden = !isSignedIn;

  if (isSignedIn) {
    loadApplicationCount(user);
  } else {
    hideApplicationCount();
  }
}

function firebaseServices() {
  return window.ResZaFirebase || null;
}

function fieldInput(field) {
  return field?.querySelector("input, select, textarea") || null;
}

function setFieldVisible(field, isVisible, isRequired) {
  const input = fieldInput(field);
  if (!field || !input) return;

  field.hidden = !isVisible;
  input.required = isVisible && isRequired;
  if (!isVisible) input.value = "";
}

function updateFundingReferenceFields() {
  const fundingType = fundingSelect?.value || "";
  const isApplication = activeAction === "application";

  setFieldVisible(modalNsfasField, isApplication && fundingType === "NSFAS Student", true);
  setFieldVisible(modalBursaryField, isApplication && fundingType === "Bursary Holder", true);
}

function prefillSignedInFields(action) {
  if (action === "login" || !signedInUser) return;

  const nameInput = fieldInput(modalNameField);
  const emailInput = fieldInput(modalEmailField);

  if (nameInput && !nameInput.value) {
    nameInput.value = signedInUser.displayName || "";
  }

  if (emailInput && !emailInput.value) {
    emailInput.value = signedInUser.email || "";
  }
}

function configureModalForm(action) {
  const isAuth = action === "login";
  const isRegister = isAuth && authMode === "register";
  const isDetails = action === "details";
  const isSignedInDetails = isDetails && Boolean(signedInUser);
  const isApplication = action === "application";

  setFieldVisible(modalNameField, (!isAuth || isRegister) && !isSignedInDetails, !isDetails);
  setFieldVisible(modalEmailField, !isSignedInDetails, true);
  setFieldVisible(modalPasswordField, isAuth, true);
  setFieldVisible(modalPhoneField, (!isAuth || isRegister) && !isSignedInDetails, isRegister || isApplication);
  setFieldVisible(modalStudentIdField, isApplication, true);
  setFieldVisible(modalStudentNumberField, isApplication, true);
  setFieldVisible(modalGenderField, isApplication, true);
  setFieldVisible(modalFundingField, isApplication, true);
  updateFundingReferenceFields();

  if (authSwitch) authSwitch.hidden = !isAuth;
  if (authSwitchText) {
    authSwitchText.textContent = isRegister
      ? "Already have an account?"
      : "Do not have an account?";
  }
  if (authToggle) {
    authToggle.textContent = isRegister ? "Login" : "Create account";
  }
}

function activeListingData() {
  const card = listings.find((listing) => listing.dataset.title === activeListing);
  if (!card) return null;

  return {
    ...listingData(card),
    campus: card.dataset.campus || "",
  };
}

function firebaseErrorMessage(error) {
  const code = error?.code || "";

  if (code === "auth/email-already-in-use") {
    return "An account already exists for this email.";
  }

  if (code === "auth/weak-password") {
    return "Use a stronger password with at least 6 characters.";
  }

  if (code === "auth/invalid-email") {
    return "Use a valid email address.";
  }

  if (code.includes("auth/")) {
    return authMode === "register"
      ? "Account creation failed. Check your details and try again."
      : "Login failed. Check your email and password.";
  }

  if (code === "permission-denied") {
    return "Firebase blocked this request. Check the Firestore rules for website submissions.";
  }

  if (code === "unavailable") {
    return "Firebase is unavailable right now. Try again shortly.";
  }

  return "We could not send that right now. Please try again.";
}

async function saveRequest(collectionName, payload) {
  const services = firebaseServices();
  if (!services?.db) {
    return saveDemoDocument(collectionName, {
      ...payload,
      createdAt: localTimestamp(),
    });
  }

  return services.db.collection(collectionName).add({
    ...payload,
    source: "resza-website",
    createdAt: services.fieldValue.serverTimestamp(),
  });
}

async function submitLogin(formData) {
  const services = firebaseServices();
  if (!services?.auth) {
    const email = textValue(formData.get("email"));
    const store = readDemoStore();
    const savedUser = store.users?.[email] || {};
    const user = {
      uid: savedUser.uid || demoUidForEmail(email),
      email,
      displayName: savedUser.displayName || savedUser.fullName || email.split("@")[0],
      isDemo: true,
    };

    setLocalSessionUser(user);
    updateAuthHeader(user);
    return;
  }

  await services.auth.signInWithEmailAndPassword(formData.get("email"), formData.get("password"));
}

async function submitRegistration(formData) {
  const services = firebaseServices();
  if (!services?.auth || !services?.db) {
    const email = textValue(formData.get("email"));
    const name = textValue(formData.get("name"));
    const phone = textValue(formData.get("phone"));
    const user = {
      uid: demoUidForEmail(email),
      email,
      displayName: name,
      phone,
      isDemo: true,
    };

    saveLocalUserProfile(user, {
      fullName: name,
      role: "student",
      source: "resza-website-demo",
      createdAt: localTimestamp(),
    });
    setLocalSessionUser(user);
    updateAuthHeader(user);
    return;
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  const credential = await services.auth.createUserWithEmailAndPassword(email, password);
  const user = credential.user;

  await user.updateProfile({ displayName: name });
  await services.db.collection("users").doc(user.uid).set({
    fullName: name,
    email,
    phone,
    role: "student",
    source: "resza-website",
    createdAt: services.fieldValue.serverTimestamp(),
  }, { merge: true });
}

function textValue(value) {
  return String(value || "").trim();
}

async function submitResidenceApplication(formData) {
  const services = firebaseServices();
  const isFirebaseReady = Boolean(services?.db);
  const timestamp = isFirebaseReady
    ? services.fieldValue.serverTimestamp()
    : localTimestamp();

  const listing = activeListingData();
  const fundingType = textValue(formData.get("fundingType"));
  const nsfasRef = fundingType === "NSFAS Student" ? textValue(formData.get("nsfasRef")) : "";
  const bursaryRef = fundingType === "Bursary Holder" ? textValue(formData.get("bursaryRef")) : "";
  const applicationData = {
    name: textValue(formData.get("name") || signedInUser?.displayName),
    studentID: textValue(formData.get("studentID")),
    studentNumber: textValue(formData.get("studentNumber")),
    contact: textValue(formData.get("phone")),
    gender: textValue(formData.get("gender")),
    fundingType,
    nsfasRef,
    bursaryRef,
    uploadedFilePath: "",
    email: textValue(formData.get("email") || signedInUser?.email),
    timestamp,
    createdAt: timestamp,
    applicationStatus: "Submitted",
    residence: activeListing,
    listingTitle: activeListing,
    listing,
    campus: listing?.campus || "",
    rent: listing?.price || 0,
    roomType: listing?.type || "",
    userId: signedInUser?.uid || "",
    source: "resza-website",
    pagePath: window.location.pathname,
    userAgent: window.navigator.userAgent,
  };

  console.debug("Submitting residence application", {
    listingTitle: applicationData.listingTitle,
    hasUser: Boolean(applicationData.userId),
    fundingType: applicationData.fundingType,
  });

  if (!isFirebaseReady) {
    const docRef = await saveDemoDocument("residence_applications", applicationData);
    if (signedInUser) {
      saveLocalUserProfile(signedInUser, {
        applicationStatus: "Submitted",
        applicationCount: countLocalApplications(signedInUser),
        fundingType,
        fundingRef: nsfasRef || bursaryRef || "Not yet available",
        lastResidenceApplicationId: docRef.id,
      });
      loadApplicationCount(signedInUser);
    }
    console.debug("Residence application saved locally", { id: docRef.id });
    return docRef;
  }

  const docRef = await services.db.collection("residence_applications").add(applicationData);

  if (signedInUser?.uid) {
    const fundingRef = nsfasRef || bursaryRef || "Not yet available";
    try {
      await services.db.collection("users").doc(signedInUser.uid).set({
        applicationStatus: "Submitted",
        applicationCount: services.fieldValue.increment(1),
        fundingType,
        fundingRef,
        lastResidenceApplicationId: docRef.id,
        updatedAt: services.fieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.warn("Application saved, but user profile status was not updated.", error);
    }
  }

  console.debug("Residence application saved", { id: docRef.id });
  if (signedInUser) {
    loadApplicationCount(signedInUser);
  }
  return docRef;
}

function currentModalState(action) {
  return action === "login" ? modalStates[authMode] : modalStates[action] || modalStates.enquiry;
}

function renderModalState() {
  configureModalForm(activeAction);

  const state = currentModalState(activeAction);
  if (modalEyebrow) modalEyebrow.textContent = state.eyebrow;
  if (modalTitle) {
    if (activeListing && activeAction === "enquiry") {
      modalTitle.textContent = `Enquire about ${activeListing}`;
    } else if (activeListing && activeAction === "application") {
      modalTitle.textContent = `Apply for ${activeListing}`;
    } else if (activeListing && activeAction === "details") {
      modalTitle.textContent = activeListing;
    } else {
      modalTitle.textContent = state.title;
    }
  }
  if (modalCopy) {
    modalCopy.textContent = activeAction === "details" && signedInUser
      ? "You are signed in. Continue and ResZa will save this room details request to your account."
      : state.body;
  }
  if (modalSubmit) modalSubmit.textContent = state.submit;
  if (modalNote) modalNote.textContent = state.note || defaultModalNote;
  prefillSignedInFields(activeAction);
}

function openModal(action, listingTitle = "") {
  if (!modal) return;

  activeAction = action;
  activeListing = listingTitle;
  authMode = "login";

  modalForm?.reset();
  if (modalSubmit) {
    modalSubmit.disabled = false;
  }
  renderModalState();

  modal.hidden = false;
  document.body.classList.add("modal-open");
  const firstInput = modal.querySelector("label:not([hidden]) input, label:not([hidden]) select");
  window.setTimeout(() => firstInput?.focus(), 80);
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

navToggle?.addEventListener("click", () => {
  const isOpen = topbar?.classList.toggle("is-open") || false;
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

function watchAuthState() {
  const services = firebaseServices();
  if (!services?.auth) {
    authWatchAttempts += 1;

    if (!services && authWatchAttempts < 20) {
      window.setTimeout(watchAuthState, 200);
      return;
    }

    updateAuthHeader(localSessionUser());
    return;
  }

  services.auth.onAuthStateChanged(updateAuthHeader);
}

watchAuthState();

window.addEventListener("scroll", () => {
  if (!topbar) return;

  const currentScrollY = window.scrollY;
  const isScrollingDown = currentScrollY > lastScrollY;
  const hasMovedEnough = Math.abs(currentScrollY - lastScrollY) > 8;

  topbar.classList.toggle("is-scrolled", currentScrollY > 12);

  if (!topbar.classList.contains("is-open") && hasMovedEnough) {
    topbar.classList.toggle("is-hidden", isScrollingDown && currentScrollY > 120);
  }

  if (currentScrollY < 40) {
    topbar.classList.remove("is-hidden");
  }

  lastScrollY = Math.max(currentScrollY, 0);
}, { passive: true });

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    topbar?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#rooms")?.scrollIntoView({ behavior: "smooth", block: "start" });
  applyFilters();
});

[keywordInput, budgetSelect, typeSelect, sortSelect].forEach((control) => {
  control?.addEventListener("input", applyFilters);
  control?.addEventListener("change", applyFilters);
});

checkboxFilters.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    quickFilters.forEach((button) => {
      if (button.dataset.quick === checkbox.dataset.checkbox) {
        button.classList.toggle("is-active", checkbox.checked);
      }
    });
    applyFilters();
  });
});

quickFilters.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.quick;
    const nextState = !button.classList.contains("is-active");
    button.classList.toggle("is-active", nextState);
    setQuickFilter(key, nextState);
    applyFilters();
    document.querySelector("#rooms")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

resetButton?.addEventListener("click", () => {
  if (keywordInput) keywordInput.value = "";
  if (budgetSelect) budgetSelect.value = "99999";
  if (typeSelect) typeSelect.value = "all";
  if (sortSelect) sortSelect.value = "recommended";
  checkboxFilters.forEach((checkbox) => {
    checkbox.checked = false;
  });
  quickFilters.forEach((button) => button.classList.remove("is-active"));
  applyFilters();
});

document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const card = trigger.closest("[data-listing]");
    openModal(trigger.dataset.openModal, card?.dataset.title || "");
  });
});

document.querySelectorAll("[data-close-modal]").forEach((trigger) => {
  trigger.addEventListener("click", closeModal);
});

logoutButton?.addEventListener("click", async () => {
  const services = firebaseServices();
  if (!services?.auth) {
    clearLocalSessionUser();
    updateAuthHeader(null);
    showToast("Logged out.");
    return;
  }

  try {
    await services.auth.signOut();
    showToast("Logged out.");
  } catch (error) {
    console.error(error);
    showToast("Could not log out. Try again.");
  }
});

authToggle?.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  modalForm?.reset();
  renderModalState();
});

fundingSelect?.addEventListener("change", updateFundingReferenceFields);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

modalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const state = currentModalState(activeAction);
  const formData = new FormData(modalForm);

  if (modalSubmit) {
    modalSubmit.disabled = true;
    if (activeAction === "login") {
      modalSubmit.textContent = authMode === "register" ? "Creating account..." : "Logging in...";
    } else if (activeAction === "application") {
      modalSubmit.textContent = "Submitting application...";
    } else {
      modalSubmit.textContent = "Sending...";
    }
  }

  const messages = {
    enquiry: activeListing
      ? `Enquiry sent for ${activeListing}.`
      : "Enquiry sent.",
    details: "Room details request sent.",
    login: authMode === "register" ? "Account created. You are now logged in." : "Logged in.",
    application: activeListing
      ? `Application submitted for ${activeListing}.`
      : "Application submitted.",
    list: "Listing request sent.",
  };

  try {
    if (activeAction === "login") {
      if (authMode === "register") {
        await submitRegistration(formData);
      } else {
        await submitLogin(formData);
      }
    } else if (activeAction === "application") {
      await submitResidenceApplication(formData);
    } else {
      const collectionName = activeAction === "list"
        ? "property_listing_requests"
        : activeAction === "details"
          ? "room_detail_requests"
          : "room_enquiries";

      await saveRequest(collectionName, {
        action: activeAction,
        listingTitle: activeListing,
        listing: activeListingData(),
        userId: signedInUser?.uid || "",
        name: formData.get("name") || signedInUser?.displayName || "",
        email: formData.get("email") || signedInUser?.email || "",
        phone: formData.get("phone") || "",
        pagePath: window.location.pathname,
        userAgent: window.navigator.userAgent,
      });
    }

    closeModal();
    showToast(messages[activeAction] || messages.enquiry);
    modalForm.reset();
  } catch (error) {
    console.error(error);
    showToast(firebaseErrorMessage(error));
  } finally {
    if (modalSubmit) {
      modalSubmit.disabled = false;
      modalSubmit.textContent = state.submit;
    }
  }
});

applyFilters();

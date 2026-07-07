const topbar = document.querySelector(".topbar");
const navToggle = document.querySelector(".nav-toggle");
const searchForm = document.querySelector("[data-search-form]");
const keywordInput = document.querySelector("[data-keyword]");
const budgetSelect = document.querySelector("[data-budget]");
const typeSelect = document.querySelector("[data-type]");
const sortSelect = document.querySelector("[data-sort]");
const resetButton = document.querySelector("[data-reset]");
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
const modalSubmit = document.querySelector("[data-modal-submit]");
const modalForm = document.querySelector("[data-modal-form]");
const modalNameField = document.querySelector("[data-name-field]");
const modalEmailField = document.querySelector("[data-email-field]");
const modalPasswordField = document.querySelector("[data-password-field]");
const modalPhoneField = document.querySelector("[data-phone-field]");
const toast = document.querySelector("[data-toast]");

let activeAction = "enquiry";
let activeListing = "";
let toastTimer;

const modalStates = {
  enquiry: {
    eyebrow: "Student enquiry",
    title: "Enquire about this room",
    body: "Send your details and the accommodation team can confirm availability and next steps.",
    submit: "Send enquiry",
  },
  details: {
    eyebrow: "Room details",
    title: "Room details",
    body: "Login or enquire to see the full address, viewing times, deposit notes, and application steps.",
    submit: "Continue",
  },
  login: {
    eyebrow: "Student account",
    title: "Login to your account",
    body: "Use your student account to track enquiries, applications, and payments.",
    submit: "Login",
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

function firebaseServices() {
  return window.ResZaFirebase || null;
}

function fieldInput(field) {
  return field?.querySelector("input") || null;
}

function setFieldVisible(field, isVisible, isRequired) {
  const input = fieldInput(field);
  if (!field || !input) return;

  field.hidden = !isVisible;
  input.required = isVisible && isRequired;
  if (!isVisible) input.value = "";
}

function configureModalForm(action) {
  const isLogin = action === "login";

  setFieldVisible(modalNameField, !isLogin, true);
  setFieldVisible(modalEmailField, true, true);
  setFieldVisible(modalPasswordField, isLogin, true);
  setFieldVisible(modalPhoneField, !isLogin, false);
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

  if (code.includes("auth/")) {
    return "Login failed. Check your email and password.";
  }

  if (code === "permission-denied") {
    return "Firebase blocked this request. Check the Firestore rules for website enquiries.";
  }

  if (code === "unavailable") {
    return "Firebase is unavailable right now. Try again shortly.";
  }

  return "We could not send that right now. Please try again.";
}

async function saveRequest(collectionName, payload) {
  const services = firebaseServices();
  if (!services?.db) {
    throw new Error("Firebase is not ready.");
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
    throw new Error("Firebase Auth is not ready.");
  }

  await services.auth.signInWithEmailAndPassword(formData.get("email"), formData.get("password"));
}

function openModal(action, listingTitle = "") {
  if (!modal) return;

  activeAction = action;
  activeListing = listingTitle;

  configureModalForm(action);

  const state = modalStates[action] || modalStates.enquiry;
  if (modalEyebrow) modalEyebrow.textContent = state.eyebrow;
  if (modalTitle) {
    if (listingTitle && action === "enquiry") {
      modalTitle.textContent = `Enquire about ${listingTitle}`;
    } else if (listingTitle && action === "details") {
      modalTitle.textContent = listingTitle;
    } else {
      modalTitle.textContent = state.title;
    }
  }
  if (modalCopy) modalCopy.textContent = state.body;
  if (modalSubmit) modalSubmit.textContent = state.submit;

  modal.hidden = false;
  document.body.classList.add("modal-open");
  const firstInput = modal.querySelector("input");
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

modalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const state = modalStates[activeAction] || modalStates.enquiry;
  const formData = new FormData(modalForm);

  if (modalSubmit) {
    modalSubmit.disabled = true;
    modalSubmit.textContent = activeAction === "login" ? "Logging in..." : "Sending...";
  }

  const messages = {
    enquiry: activeListing
      ? `Enquiry sent for ${activeListing}.`
      : "Enquiry sent.",
    details: "Room details request sent.",
    login: "Logged in.",
    list: "Listing request sent.",
  };

  try {
    if (activeAction === "login") {
      await submitLogin(formData);
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
        name: formData.get("name") || "",
        email: formData.get("email") || "",
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

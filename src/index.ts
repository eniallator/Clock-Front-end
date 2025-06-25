import { closestEl, getAll, getEl, toHtml } from "./helpers.ts";

getAll('[tabindex="0"]').forEach((el) => {
  el.onkeyup = (evt) => {
    if (evt.key === "Enter" && evt.target === el) el.click();
  };
});

const toggleBtnDisabled = (
  btnEl: HTMLButtonElement,
  isDisabled: boolean,
  isEnabled: boolean = !isDisabled
) => {
  if (isDisabled) {
    btnEl.setAttribute("disabled", "");
    btnEl.classList.add("button-disabled");
    btnEl.classList.remove("button-primary");
  } else if (isEnabled) {
    btnEl.removeAttribute("disabled");
    btnEl.classList.remove("button-disabled");
    btnEl.classList.add("button-primary");
  }
};

const saveBtn = getEl<HTMLButtonElement>("button[type=submit]");

const timeRegex =
  /^((0?[1-9]|1[0-2]):[0-5]\d(am|pm)|([01]\d|2[0-3]):[0-5]\d)$/i;
const colorRegex = /^[\da-f]{6}$/i;

const getErrorMsgEl = (inputEl: HTMLInputElement) =>
  getEl(".error-message", closestEl(inputEl, ".form-control"));

const toggleErrorMessage = (inputEl: HTMLInputElement, hide: boolean) => {
  getErrorMsgEl(inputEl).classList.toggle("hidden", hide);
  const saveBtnDisabled = saveBtn.classList.contains("button-disabled");
  toggleBtnDisabled(
    saveBtn,
    !hide && !saveBtnDisabled,
    getAll(".error-message").length === getAll(".error-message.hidden").length
  );
};

const initTimeInput = (el: HTMLInputElement) => {
  el.onchange = () => {
    const valid = timeRegex.test(el.value);
    toggleErrorMessage(el, valid);
  };
};

getAll<HTMLInputElement>(".time-input").forEach(initTimeInput);
const timeModeToggle = getEl<HTMLInputElement>(".time-mode");
export const positiveMod = (a: number, b: number) => ((a % b) + b) % b;

const timePartsRegex = /(\d+):(\d+)(am|pm)?/i;
timeModeToggle.onchange = () => {
  getAll<HTMLInputElement>(".time-input").forEach((el) => {
    const [_, hrStr, minStr, mode] = timePartsRegex.exec(el.value) ?? [];
    if (hrStr == null) return;

    const hr = Number(hrStr);

    if (timeModeToggle.checked && hr < 24) {
      const adjustedHr = positiveMod(hr - 1, 12) + 1;
      el.value = `${adjustedHr}:${minStr}${hr < 12 ? "am" : "pm"}`;
    } else if (!timeModeToggle.checked && hr > 0 && hr <= 12) {
      const adjustedHrStr = `${(hr % 12) + Number(mode === "pm") * 12}`;
      el.value = `${adjustedHrStr.padStart(2, "0")}:${minStr}`;
    }
  });
};

const timeInput = getEl<HTMLInputElement>("input[name=time]");

timeInput.value = new Date()
  .toLocaleString()
  .replace(/\d+\/\d+\/\d+[^\d]*(?<t>\d+:\d+).*/, "$<t>");

const colorTextEl = getEl<HTMLInputElement>(".color-input input[type=text]");
const colorEl = getEl<HTMLInputElement>(".color-input input[type=color]");

colorEl.onchange = () => {
  colorTextEl.value = colorEl.value.slice(1).toUpperCase();
};
colorTextEl.onchange = () => {
  const valid = colorRegex.test(colorTextEl.value);
  toggleErrorMessage(colorTextEl, valid);
  if (valid) colorEl.value = `#${colorTextEl.value}`;
};

const rowsEl = getEl(".collection-rows");
const collectionLimit = Number(rowsEl.getAttribute("collection-limit"));
const newRowBtn = getEl<HTMLButtonElement>(".collection-new-row");
const rowTemplateHtml = getEl(".collection-template").innerHTML;

const createAlarm = () => {
  const newRow = toHtml<HTMLInputElement>(rowTemplateHtml);
  rowsEl.appendChild(newRow);
  const newTimeInput = newRow.querySelector<HTMLInputElement>(".time-input");
  if (newTimeInput) {
    initTimeInput(newTimeInput);
  }

  getEl(".delete-row", newRow).onclick = (evt) => {
    evt.preventDefault();
    newRow.remove();

    if (newRowBtn.classList.contains("button-disabled")) {
      toggleBtnDisabled(newRowBtn, false);
    }
  };

  if (rowsEl.children.length >= collectionLimit) {
    toggleBtnDisabled(newRowBtn, true);
  }

  return newRow;
};

newRowBtn.onclick = createAlarm;

const initialValues = new URLSearchParams(location.search);

for (const [key, value] of initialValues.entries()) {
  switch (key) {
    case "time": {
      if (timeRegex.test(value)) {
        timeInput.value = value;
      }
      break;
    }

    case "brightness": {
      const brightnessNum = Number(value);
      if (brightnessNum >= 0 && brightnessNum <= 1) {
        getEl<HTMLInputElement>("input[name=brightness]").value = value;
      }
      break;
    }

    case "color": {
      const hexValue = value.slice(1).toUpperCase();
      if (colorRegex.test(hexValue)) {
        colorTextEl.value = hexValue;
        colorEl.value = `#${hexValue}`;
      }
      break;
    }

    case "alarm": {
      if (timeRegex.test(value)) {
        createAlarm().value = value;
      }
      break;
    }
  }
}

// Time input make an option to send "now" instead of a time

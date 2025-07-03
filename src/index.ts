import { closestEl, getAll, getEl, toHtml } from "./helpers.ts";
import { ForeachAble } from "./types.ts";

getAll('[tabindex="0"]').forEach(([_, el]) => {
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
    getAll(".error-message").toArray().length ===
      getAll(".error-message.hidden").toArray().length
  );
};

const initTimeInput = (el: HTMLInputElement) => {
  el.onchange = () => {
    const valid = timeRegex.test(el.value);
    toggleErrorMessage(el, valid);
  };
};

getAll<HTMLInputElement>(".time-input").forEach(([_, el]) => {
  initTimeInput(el);
});
const toggle12hr = getEl<HTMLInputElement>(".time-mode");

const positiveMod = (a: number, b: number) => ((a % b) + b) % b;

const time24to12 = (hr: number, minStr: string) =>
  `${positiveMod(hr - 1, 12) + 1}:${minStr}${hr < 12 ? "am" : "pm"}`;
const time12to24 = (hr: number, minStr: string, mode: string) =>
  `${(hr % 12) + Number(mode === "pm") * 12}:`.padStart(3, "0") + minStr;

const time12hrRegex = /(1[0-2]|[1-9]):([0-5]\d)(am|pm)/i;
const time24hrRegex = /(2[0-3]|[01]\d):([0-5]\d)/i;

toggle12hr.onchange = () => {
  getAll<HTMLInputElement>(".time-input").forEach(([_, el]) => {
    if (toggle12hr.checked) {
      const [_, hrStr, minStr] = time24hrRegex.exec(el.value) ?? [];
      if (hrStr != null && minStr != null) {
        el.value = time24to12(Number(hrStr), minStr);
      }
    } else {
      const [_, hrStr, minStr, mode] = time12hrRegex.exec(el.value) ?? [];
      if (hrStr != null && minStr != null && mode != null) {
        el.value = time12to24(Number(hrStr), minStr, mode);
      }
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

const form = getEl<HTMLFormElement>("form");

const updateFormInputs = (entries: ForeachAble<[string, string]>) => {
  rowsEl.innerHTML = "";

  entries.forEach(([key, value]) => {
    switch (key) {
      case "time": {
        const [_, hrStr, minStr] = time24hrRegex.exec(value) ?? [];
        if (hrStr != null && minStr != null) {
          timeInput.value = `${hrStr}:${minStr}`;
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
        const [_, hrStr, minStr] = time24hrRegex.exec(value) ?? [];
        if (hrStr != null && minStr != null) {
          createAlarm().value = `${hrStr}:${minStr}`;
        }
        break;
      }
    }
  });
};

const getFormValue = (): IteratorObject<[string, string]> => {
  const timeInputs = new Set(
    getAll<HTMLInputElement>(".time-input").map(([_, el]) => el.name)
  );
  const formData = new FormData(form);

  return formData
    .entries()
    .filter((entry): entry is [string, string] => !(entry[1] instanceof File))
    .map(([key, value]) => {
      if (timeInputs.has(key) && toggle12hr.checked) {
        const [_, hrStr, minStr, mode] = time12hrRegex.exec(value) ?? [];

        if (hrStr != null && minStr != null && mode != null) {
          return [key, time12to24(Number(hrStr), minStr, mode)];
        } else throw new Error("Error deserialising");
      } else {
        return [key, value];
      }
    });
};

form.onsubmit = (evt) => {
  evt.preventDefault();
  evt.stopPropagation();

  const query = new URLSearchParams([...getFormValue()]);

  const { protocol, host, pathname } = location;
  const url = `${protocol}//${host}${pathname}?${query.toString()}`;

  void fetch(url, { method: "GET" });

  history.pushState(null, "", url);
};

const queryRegex = /\?.+/;
setInterval(() => {
  void fetch(`${location.protocol}//${location.host}`, {
    method: "GET",
  }).then(({ url }) => {
    const [_, query] = queryRegex.exec(url) ?? [];
    if (query != null) {
      updateFormInputs(new URLSearchParams(query).entries());
    }
  });
}, 5000);

newRowBtn.onclick = createAlarm;

const initialValues = new URLSearchParams(location.search);
updateFormInputs(initialValues.entries());

// Time input make an option to send "now" instead of a time

class RadioInput {
    constructor(id, label, value=false, func=(e) => { }) {
        this.id = id;
        this.label = label;
        this.value = value;
        this.func = func;
    }
}

class CheckboxInput {
    constructor(id, label, value, func=(e) => { }) {
        this.id = id;
        this.label = label;
        this.value = value;
        this.func = func;
    }
}

class NumberInput {
    constructor(id, label, units, step=1, value=0, min=null, max=null) {
        this.id = id;
        this.label = label;
        this.units = units;
        this.value = value;
        this.step = step;
        this.min = min;
        this.max = max;
    }
}

class FormMaker {
    constructor(formId) {
        this.formId = formId;
        this.eventListeners = {};
        this.inputIds = [];
        this.childForms = [];
        
        for (const el of document.querySelectorAll(`#${formId} input`)) {
            this.inputIds.push(el.id);
        }
        for (const el of document.querySelectorAll(`#${formId} .childForm`)) {
            this.childForms.push(el.id);
        }

    }

    get DOMObject() { return document.getElementById(this.formId); }
    
    AddRadio(name, radioObject) {
        const inputId = `${this.formId}-${radioObject.id}`;
        const node = document.createElement("input");

        node.type = "radio";
        node.id = inputId;
        node.name = name;
        node.value = radioObject.id;
        node.required = true;
        node.checked = radioObject.value;

        const label = document.createElement("label");
        label.htmlFor = inputId;
        label.innerHTML = radioObject.label;

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(label);
        this.DOMObject.appendChild(document.createElement("br"));
        
        document.getElementById(`${inputId}`).addEventListener("change", radioObject.func);
        
        this.inputIds.push(`${this.formId}-${radioObject.id}`);
        return this;
    }
    
    AddCheckbox(name, checkboxObject) {
        const inputId = `${this.formId}-${checkboxObject.id}`;
        const node = document.createElement("input");

        node.type = "checkbox";
        node.id = inputId;
        node.name = name;
        node.value = checkboxObject.id;
        node.checked = checkboxObject.value;

        const label = document.createElement("label");
        label.htmlFor = inputId;
        label.innerHTML = checkboxObject.label;

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(label);
        this.DOMObject.appendChild(document.createElement("br"));

        document.getElementById(`${inputId}`).addEventListener("change", checkboxObject.func);

        this.inputIds.push(`${this.formId}-${checkboxObject.id}`);
        return this;
    }

    AddNumber(name, number) {
        const inputId = `${this.formId}-${number.id}`;

        const firstLabel = document.createElement("label");
        firstLabel.htmlFor = inputId;
        firstLabel.innerHTML = number.label;

        const node = document.createElement("input");

        node.type = "number";
        node.id = inputId;
        node.name = `${this.formId}-${name}`;
        node.step = number.step;
        if (number.min != null) {
            node.min = number.min;
        }
        if (number.max != null) {
            node.max = number.max;
        }
        node.value = number.value;
        node.required = true;

        
        const secondLabel = document.createElement("label");
        secondLabel.htmlFor = inputId;
        secondLabel.innerHTML = number.units;
        
        this.DOMObject.appendChild(firstLabel);
        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(secondLabel);
        this.DOMObject.appendChild(document.createElement("br"));

        document.getElementById(`${inputId}`).addEventListener("change", number.func);

        this.inputIds.push(inputId);
        return this;
    }

    AddChildForm(id) {
        const node = document.createElement("div");

        node.id = id;
        node.class = "childForm";

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(document.createElement("br"));

        this.childForms.push(id);
        return this;
    }

    AddSubmitButton(id, label, func) {
        const node = document.createElement("button");

        node.id = `${this.formId}-${id}`;
        node.type = "submit";
        node.innerHTML = label;

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(document.createElement("br"));
        
        this.DOMObject.addEventListener("submit", (e) => {
            e.preventDefault();
            func(this.GetValues());
        });
        return this;
    }

    Clear() {
        this.DOMObject.innerHTML = '\n';
        this.inputIds = [];
        this.childForms = [];
        return this;
    }

    GetValues(values=null) {
        if (values === null){
            values = {};
        }

        for (let key of this.inputIds) {
            const elem = document.getElementById(key);
            if (elem == null){
                values[key] = null;
            } else if (elem.type == "number") {
                values[key] = parseFloat(elem.value);
            } else if (elem.type == "checkbox") {
                values[key] = elem.checked;
            } else if (elem.type == "radio") {
                let radio = document.querySelector(`input[name="${elem.name}"]:checked`);
                if (radio == null) {
                    values[elem.name] = null;
                } else {
                    values[elem.name] = radio.value;
                }
            } else {
                values[key] = elem.value;
            }
        }
        for (let formId of this.childForms) {
            if (document.getElementById(formId)) {
                new FormMaker(formId).GetValues(values);
            }
        }

        return values;
    }

    ConnectNumbers(id1, id2, func1To2, func2To1) {
        const elem1 = document.getElementById(this.formId + '-' + id1);
        const elem2 = document.getElementById(this.formId + '-' + id2);
        if (elem1 === null || elem2 === null) {
            return this;
        }

        elem1.addEventListener("change", (e) => {
            elem2.value = roundByStep(
                func1To2(parseFloat(elem1.value)), 
                elem2.step ? parseFloat(elem2.step) : 1, 
                elem2.min ? parseFloat(elem2.min) : 0
            );
        });

        elem2.addEventListener("change", (e) => {
            elem1.value = roundByStep(
                func2To1(parseFloat(elem2.value)), 
                elem1.step ? parseFloat(elem1.step) : 1, 
                elem1.min ? parseFloat(elem1.min) : 0
            );
        });

        return this;

    }
}
function makeInputId(formId, inputId) {
    return formId + '-' + inputId;
}

class RadioInput {
    constructor(id, groupId, label, defaultValue=false, func=(e) => { }) {
        this.id = id;
        this.label = label;
        this.groupId = groupId;
        this.defaultValue = defaultValue;
        this.func = func;
    }

    get type() { return "radio"; }

    get key() { return this.groupId; }

    get value() { return this.id; }

    GetValue(formId) {
        const elem = document.getElementById(makeInputId(formId, this.value));
        if (elem === null) {
            return null
        }

        let radio = document.querySelector(`#${formId} input[name="${elem.name}"]:checked`);
        return radio == null ? null : radio.value;
    }
}

class CheckboxInput {
    constructor(id, groupId, label, defaultValue=false, func=(e) => { }) {
        this.id = id;
        this.label = label;
        this.groupId = groupId;
        this.defaultValue = defaultValue;
        this.func = func;
    }

    get type() { return "checkbox"; }

    get key() { return this.id; }

    get value() { return this.id; }

    GetValue(formId) {
        const elem = document.getElementById(makeInputId(formId, this.value));
        
        return elem === null ? null : elem.checked;
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

    get type() { return "number"; }

    get key() { return this.id; }

    get groupId() { return this.id; }

    GetValue(formId) {
        const elem = document.getElementById(makeInputId(formId, this.id));
        
        return elem === null ? null : parseFloat(elem.value);
    }
}

class FormMaker {
    constructor(formId) {
        this.formId = formId;
        this.eventListeners = {};
        this.inputIds = [];
        this.childForms = [];
        this.inputObjects = [];
        
        for (const el of document.querySelectorAll(`#${formId} input`)) {
            const label = document.querySelector(`#${formId} label[for="${el.id}"][purpose="label"]`);
            if (el.type == 'number') {
                const unitsLabel = document.querySelector(`#${formId} label[for="${el.id}"][purpose="units"]`);

                this.inputObjects.push(new NumberInput(
                    el.id.replace(formId + '-', ''),
                    label.innerHTML,
                    unitsLabel.innerHTML,
                    el.step,
                    el.value,
                    el.min,
                    el.max
                ));
            } else if (el.type == 'checkbox') {
                this.inputObjects.push(new CheckboxInput(
                    el.value,
                    el.name,
                    label.innerHTML,
                    el.checked
                ));
            } else if (el.type == 'radio') {
                this.inputObjects.push(new RadioInput(
                    el.value,
                    el.name,
                    label.innerHTML,
                    el.checked
                ));
            }
        }
        for (const el of document.querySelectorAll(`#${formId} .childForm`)) {
            this.childForms.push(el.id);
        }

    }

    get DOMObject() { return document.getElementById(this.formId); }

    MakeLabel(text, forId, purpose='label') {
        const label = document.createElement("label");
        label.htmlFor = forId;
        label.innerHTML = text;
        label.setAttribute('purpose', purpose);

        return label;
    }

    MakeBasicInputNode(object) {
        const node = document.createElement("input");

        node.type = object.type;
        node.id = makeInputId(this.formId, object.id);
        node.name = object.groupId;
        if (object.type != 'checkbox') {
            node.required = true;
        }
        node.value = object.value;

        return node;
    }
    
    AddRadio(radioObject) {
        const inputId = makeInputId(this.formId, radioObject.id);
        const node = this.MakeBasicInputNode(radioObject);

        node.checked = radioObject.defaultValue;

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(this.MakeLabel(radioObject.label, inputId));
        this.DOMObject.appendChild(document.createElement("br"));
        
        document.getElementById(inputId).addEventListener("change", radioObject.func);
        
        this.inputObjects.push(radioObject);
        return this;
    }
    
    AddCheckbox(checkboxObject) {
        const inputId = makeInputId(this.formId, checkboxObject.id);
        const node = this.MakeBasicInputNode(checkboxObject);

        node.checked = checkboxObject.defaultValue;

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(this.MakeLabel(checkboxObject.label, inputId));
        this.DOMObject.appendChild(document.createElement("br"));

        document.getElementById(inputId).addEventListener("change", checkboxObject.func);

        this.inputObjects.push(checkboxObject);
        return this;
    }

    AddNumber(number) {
        const inputId = makeInputId(this.formId, number.id);
        const node = this.MakeBasicInputNode(number);

        node.step = number.step;
        if (number.min != null) {
            node.min = number.min;
        }
        if (number.max != null) {
            node.max = number.max;
        }
        node.required = true;

        this.DOMObject.appendChild(this.MakeLabel(number.label, inputId));
        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(this.MakeLabel(number.units, inputId, 'units'));
        this.DOMObject.appendChild(document.createElement("br"));

        document.getElementById(inputId).addEventListener("change", number.func);

        this.inputObjects.push(number)
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

        for (let inputObj of this.inputObjects) {
            values[inputObj.key] = inputObj.GetValue(this.formId);
        }
        for (let formId of this.childForms) {
            if (document.getElementById(formId)) {
                new FormMaker(formId).GetValues(values);
            }
        }

        return values;
    }

    ConnectNumbers(id1, id2, func1To2, func2To1) {
        const elem1 = document.getElementById(makeInputId(this.formId, id1));
        const elem2 = document.getElementById(makeInputId(this.formId, id2));
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
function makeInputId(formId, inputId) {
    return formId + '-' + inputId;
}

function spanFactory(text) {
    const t = document.createElement('span');
    t.innerHTML = text;
    return t;
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
    constructor(id, label, domain, changeFunc) {
        this.id = id;
        this.label = label;
        this.func = changeFunc;

        if (domain === undefined) {
            domain = new NumberDomain();
        }
        this.domain = domain;
    }

    get type() { return "number"; }

    get key() { return this.id; }

    get groupId() { return this.id; }

    get value() { return this.domain.value; }


    GetValue(formId) {
        const elem = document.getElementById(makeInputId(formId, this.id));
        
        return elem === null ? null : parseFloat(elem.value);
    }
}

class NumberDomain {
    constructor(value=0, units='', step=1, min=null, max=null) {
        this.value = value;
        this.units = units;
        this.step = step;
        this.min = min;
        this.max = max;
    }
}

class Vec2Input {
    constructor(id, label, numberDomain1, numberDomain2, changeFunc) {
        this.id = id;
        this.label = label;
        this.numberDomain1 = numberDomain1;
        this.numberDomain2 = numberDomain2;
        this.func = changeFunc;

        this.numberObject1 = new NumberInput(id + '-x', '', numberDomain1);
        this.numberObject2 = new NumberInput(id + '-y', '', numberDomain2);
    }

    get type() { return "vec2"; }

    get key() { return this.id; }

    get groupId() { return this.id; }

    GetValue(formId) {
        const x = this.numberObject1.GetValue(formId);
        const y = this.numberObject2.GetValue(formId);
        
        return x === null || y === null ? null : new Vec2(x, y);
    }
}

class FormMaker {
    constructor(formId) {
        this.formId = formId;
        this.inputIds = [];
        this.childForms = [];
        this.inputObjects = [];
        
        for (const el of document.querySelectorAll(`#${formId} input`)) {
            const label = document.querySelector(`#${formId} label[for="${el.id}"][purpose="label"]`);
            if (el.type == 'number' && el.getAttribute('purpose') == 'solo') {
                const unitsLabel = document.querySelector(`#${formId} label[for="${el.id}"][purpose="units"]`);

                this.inputObjects.push(new NumberInput(
                    el.id.replace(formId + '-', ''),
                    label.innerHTML,
                    new NumberDomain(
                        el.value,
                        unitsLabel.innerHTML,
                        el.step,
                        el.min,
                        el.max
                    )
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

    get DOMObject() { 
        const obj = document.getElementById(this.formId);
        if (obj === null) {
            window.alert(`Форма '${this.formId}' не найдена в DOM. Убедитесь, что такое имя валидно`);
            throw Error(`Form with id=${this.formId} was not found!`);
        } 
        return obj;
    }

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
        node.setAttribute('purpose', 'solo');

        node.step = number.domain.step;
        if (number.domain.min != null) {
            node.min = number.domain.min;
        }
        if (number.domain.max != null) {
            node.max = number.domain.max;
        }

        this.DOMObject.appendChild(this.MakeLabel(number.label, inputId));
        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(this.MakeLabel(number.domain.units, inputId, 'units'));
        this.DOMObject.appendChild(document.createElement("br"));

        document.getElementById(inputId).addEventListener("change", number.func);

        this.inputObjects.push(number);
        return this;
    }

    AddVec2(vec2Object) {
        const inputId = makeInputId(this.formId, vec2Object.id);
        const node1 = this.MakeBasicInputNode(vec2Object.numberObject1);

        node1.step = vec2Object.numberDomain1.step;
        if (vec2Object.numberDomain1.min != null) {
            node1.min = vec2Object.numberDomain1.min;
        }
        if (vec2Object.numberDomain1.max != null) {
            node1.max = vec2Object.numberDomain1.max;
        }

        const node2 = this.MakeBasicInputNode(vec2Object.numberObject2);

        node2.step = vec2Object.numberDomain2.step;
        if (vec2Object.numberDomain2.min != null) {
            node2.min = vec2Object.numberDomain2.min;
        }
        if (vec2Object.numberDomain2.max != null) {
            node2.max = vec2Object.numberDomain2.max;
        }

        this.DOMObject.appendChild(this.MakeLabel(vec2Object.label, inputId));
        this.DOMObject.appendChild(spanFactory(' ('));
        this.DOMObject.appendChild(node1);
        this.DOMObject.appendChild(
            this.MakeLabel(
                vec2Object.numberDomain1.units, 
                makeInputId(this.formId, vec2Object.numberObject1.id), 
                'units'
            )
        );
        this.DOMObject.appendChild(spanFactory(', '));
        this.DOMObject.appendChild(node2);
        this.DOMObject.appendChild(
            this.MakeLabel(
                vec2Object.numberDomain2.units, 
                makeInputId(this.formId, vec2Object.numberObject2.id), 
                'units'
            )
        );
        this.DOMObject.appendChild(spanFactory(')'));
        this.DOMObject.appendChild(document.createElement("br"));

        document.getElementById(
            makeInputId(this.formId, vec2Object.numberObject2.id)
        ).addEventListener("change", vec2Object.func);
        document.getElementById(
            makeInputId(this.formId, vec2Object.numberObject1.id)
        ).addEventListener("change", vec2Object.func);

        this.inputObjects.push(vec2Object)
        return this;
        
    }

    AddParagraph(text) {
        const node = document.createElement('p');
        node.innerHTML = text;
        this.DOMObject.append(node);

        return this;
    }

    AddChildForm(id) {
        const node = document.createElement("div");

        node.id = id;
        node.classList.add("childForm");

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

    AddButton(id, label, func) {
        const node = document.createElement("button");

        node.id = `${this.formId}-${id}`;
        node.innerHTML = label;

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(document.createElement("br"));
        
        node.addEventListener("click", (e) => {
            e.preventDefault();
            func();
        });
        return this;
    }

    AddDisplay(id) {
        const node = document.createElement("div");
        node.id = makeInputId(this.formId, id);

        this.DOMObject.appendChild(node);

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

    GetElement(id) {
        return document.getElementById(makeInputId(this.formId, id));
    }
}
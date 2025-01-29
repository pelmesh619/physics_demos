function makeInputId(formId, inputId) {
    return formId + '-' + inputId;
}

function spanFactory(text) {
    const t = document.createElement('span');
    t.innerHTML = text;
    return t;
}

class InputBase {
    MakeLabel(text, forId, purpose='label') {
        const label = document.createElement("label");
        label.htmlFor = forId;
        label.innerHTML = text;
        label.setAttribute('purpose', purpose);

        return label;
    }

    MakeBasicInputNode(form) {
        const node = document.createElement("input");

        node.type = this.type;
        node.id = makeInputId(form.formId, this.id);
        node.name = this.groupId;
        if (this.type != 'checkbox') {
            node.required = true;
        }
        node.value = this.value;

        return node;
    }
}

class RadioInput extends InputBase {
    constructor(id, groupId, label, defaultValue=false, func=(e) => { }) {
        super();
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

class CheckboxInput extends InputBase {
    constructor(id, groupId, label, defaultValue=false, func=(e) => { }) {
        super();
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

class NumberInput extends InputBase {
    constructor(id, label, domain, changeFunc) {
        super();
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

    SetValue(formId, value) {
        const elem = document.getElementById(makeInputId(formId, this.id));
        
        if (elem != null) {
            elem.value = roundByStep(
                parseFloat(value), 
                this.domain.step ? this.domain.step : 1, 
                this.domain.min ? this.domain.min : 0
            );;
        }
    }

    BuildNode(form) {
        const divNode = document.createElement('div');
        const inputId = makeInputId(form.formId, this.id);
        const node = this.MakeInputNode(form);
        node.setAttribute('purpose', 'solo');


        divNode.appendChild(this.MakeLabel(this.label, inputId));
        divNode.appendChild(node);
        divNode.appendChild(this.MakeLabel(this.domain.units, inputId, 'units'));
        divNode.appendChild(document.createElement("br"));

        return divNode;
    }

    MakeInputNode(form) {
        const node = document.createElement("input");

        node.type = "number";
        node.id = makeInputId(form.formId, this.id);
        node.name = this.groupId;
        node.value = this.value;

        node.step = this.domain.step;
        if (this.domain.min != null) {
            node.min = this.domain.min;
        }
        if (this.domain.max != null) {
            node.max = this.domain.max;
        }

        return node;
    }

    AddChangeHandler(form, func) {
        document.getElementById(
            makeInputId(form.formId, this.id)
        ).addEventListener("change", func);

        return this;
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

class NumberInputScheme {
    constructor(value=0, units='', step=1, min=null, max=null) {
        this.value = value;
        this.units = units;
        this.step = step;
        this.min = min;
        this.max = max;
    }

    Build(id, label, changeFunc) {
        return new NumberInput(id, label, this, changeFunc);
    }
}

class Vec2InputScheme {
    constructor(numberInputScheme1, numberInputScheme2) {
        this.numberInputScheme1 = numberInputScheme1;
        this.numberInputScheme2 = numberInputScheme2;
    }

    Build(id, label, changeFunc) {
        return new Vec2Input(id, label, this, changeFunc);
    }
}

class Vec2Input extends InputBase {
    constructor(id, label, vec2InputScheme) {
        super();
        this.id = id;
        this.label = label;
        this.numberInputScheme1 = vec2InputScheme.numberInputScheme1;
        this.numberInputScheme2 = vec2InputScheme.numberInputScheme2;

        this.numberObject1 = vec2InputScheme.numberInputScheme1.Build(id + '-x', '');
        this.numberObject2 = vec2InputScheme.numberInputScheme2.Build(id + '-y', '');
    }

    get type() { return "vec2"; }

    get key() { return this.id; }

    get groupId() { return this.id; }

    GetValue(formId) {
        const x = this.numberObject1.GetValue(formId);
        const y = this.numberObject2.GetValue(formId);
        
        return x === null || y === null ? null : new Vec2(x, y);
    }

    SetValue(formId, value) {
        this.numberObject1.SetValue(formId, value.x);
        this.numberObject2.SetValue(formId, value.y);
    }

    BuildNode(form) {
        const divNode = document.createElement('div');

        const inputId = makeInputId(form.formId, this.id);
        const node1 = this.numberObject1.MakeInputNode(form);
        const node2 = this.numberObject2.MakeInputNode(form);

        divNode.appendChild(this.MakeLabel(this.label, inputId));
        divNode.appendChild(spanFactory(' ('));
        divNode.appendChild(node1);
        divNode.appendChild(
            this.MakeLabel(
                this.numberInputScheme1.units, 
                makeInputId(form.formId, this.numberObject1.id), 
                'units'
            )
        );
        divNode.appendChild(spanFactory(', '));
        divNode.appendChild(node2);
        divNode.appendChild(
            this.MakeLabel(
                this.numberInputScheme2.units, 
                makeInputId(form.formId, this.numberObject2.id), 
                'units'
            )
        );
        divNode.appendChild(spanFactory(')'));
        divNode.appendChild(document.createElement("br"));

        return divNode;
    }

    AddChangeHandler(form, func) {
        this.numberObject1.AddChangeHandler(form, func);
        this.numberObject2.AddChangeHandler(form, func);

        return this;
    }
}

class ListInputScheme {
    constructor(inputScheme) {
        this.inputScheme = inputScheme;
    }

    Build(id, label) {
        return new ListInput(id, label, this);
    }
}

class ListInput extends InputBase {
    constructor(id, label, listInputScheme) {
        super();
        this.id = id;
        this.label = label;
        this.inputScheme = listInputScheme.inputScheme;

        this.inputObjects = [];
    }

    get type() { return "list"; }

    get key() { return this.id; }

    get groupId() { return this.id; }

    CreateNewInputObject() {
        this.inputObjects.push(this.inputScheme.Build(this.id + '-' + this.inputObjects.length, 'TEST CHANGE IT'));
    }

    GetValue(formId) {
        return this.inputObjects.map((v) => v.GetValue(formId));
    }

    SetValue(formId, value) {
        this.inputObjects.forEach((v, i) => {
            v.SetValue(formId, value[i]);
        });
    }

    Reload(form) {
        const divId = makeInputId(form.formId, this.id) + '-div';

        const divNode = document.getElementById(divId);
        divNode.innerHTML = '';

        this._buildNode(form, divNode);
    }

    _buildNode(form, divNode) {
        const inputId = makeInputId(form.formId, this.id);

        divNode.appendChild(this.MakeLabel(this.label, inputId));

        const addButton = document.createElement('button');
        addButton.innerText = 'SAMPLE TEXT';
        addButton.id = inputId + '-addButton';

        let t = this;
        addButton.onclick = (e) => { t.CreateNewInputObject(); t.Reload(form); };

        divNode.appendChild(addButton);

        this.inputObjects.forEach((inputObject) => {
            divNode.appendChild(inputObject.BuildNode(form));
        });
    }

    BuildNode(form) {
        const inputId = makeInputId(form.formId, this.id);
        const divNode = document.createElement('div');
        divNode.id = inputId + '-div';

        this._buildNode(form, divNode);

        return divNode;
    }

    AddChangeHandler(form, func) {
        this.inputObjects.forEach((inputObject) => {
            inputObject.AddChangeHandler(form, func);
        });

        return this;
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
        this.DOMObject.appendChild(number.BuildNode(this));

        number.AddChangeHandler(this, number.func);

        this.inputObjects.push(number);
        return this;
    }

    AddInputObject(input) {
        this.DOMObject.appendChild(input.BuildNode(this));

        input.AddChangeHandler(this, input.func);

        this.inputObjects.push(input);
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
        
        if (!this.DOMObject.onsubmit) {
            this.DOMObject.onsubmit = (e) => {
                e.preventDefault();
                func(this.GetValues());
            };
        }

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

    ConnectInputs(id1, id2, func1To2, func2To1) {
        const input1 = this.inputObjects.find((v) => v.id == id1);
        const input2 = this.inputObjects.find((v) => v.id == id2);
        if (input1 === null || input2 === null) {
            return this;
        }

        const formId = this.formId;

        input1.AddChangeHandler(this, (e) => {
            input2.SetValue(formId, func1To2(input1.GetValue(formId)));
        });
        input2.AddChangeHandler(this, (e) => {
            input1.SetValue(formId, func2To1(input2.GetValue(formId)));
        });

        return this;
    }

    GetElement(id) {
        return document.getElementById(makeInputId(this.formId, id));
    }
}
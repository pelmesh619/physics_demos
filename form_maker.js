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

class InputSchemeBase {
    constructor() {
        this.label = '';
    }

    WithLabel(text) {
        this.label = text;

        return this;
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

    Build() {
        throw new TypeError("Call in base class");
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

    BuildNode(form) {
        const divNode = document.createElement('div');
        const inputId = makeInputId(form.formId, this.id);
        const node = this.MakeBasicInputNode(form);

        node.checked = this.defaultValue;

        divNode.appendChild(node);
        divNode.appendChild(this.MakeLabel(this.label, inputId));
        divNode.appendChild(document.createElement("br"));
        
        return divNode;
    }

    AddChangeHandler(form, func) {
        document.getElementById(
            makeInputId(form.formId, this.id)
        ).addEventListener("change", func);

        return this;
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

    BuildNode(form) {
        const divNode = document.createElement('div');
        const inputId = makeInputId(form.formId, this.id);
        const node = this.MakeBasicInputNode(form);

        node.checked = this.defaultValue;

        divNode.appendChild(node);
        divNode.appendChild(this.MakeLabel(this.label, inputId));
        divNode.appendChild(document.createElement("br"));

        return divNode;
    }

    AddChangeHandler(form, func) {
        document.getElementById(
            makeInputId(form.formId, this.id)
        ).addEventListener("change", func);

        return this;
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
            );
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

class NumberInputScheme extends InputSchemeBase {
    constructor(value=0, units='', step=1, min=null, max=null) {
        super();
        this.value = value;
        this.units = units;
        this.step = step;
        this.min = min;
        this.max = max;
    }

    Build(id, label, changeFunc) {
        return new NumberInput(id, label != undefined ? label : this.label, this, changeFunc);
    }
}


class StringInputScheme extends InputSchemeBase {
    constructor(value="") {
        super();
        this.value = value;
    }

    Build(id, label, changeFunc) {
        return new StringInput(id, label != undefined ? label : this.label, this, changeFunc);
    }
}

class StringInput extends InputBase {
    constructor(id, label, inputScheme, changeFunc) {
        super();
        this.id = id;
        this.label = label;
        this.func = changeFunc;

        this.inputScheme = inputScheme;
    }

    get type() { return "string"; }

    get key() { return this.id; }

    get value() { return this.inputScheme.value; }


    GetValue(formId) {
        const elem = document.getElementById(makeInputId(formId, this.id));
        
        return elem === null ? null : elem.value;
    }

    SetValue(formId, value) {
        const elem = document.getElementById(makeInputId(formId, this.id));
        
        if (elem != null) {
            elem.value = value;
        }
    }

    BuildNode(form) {
        const divNode = document.createElement('div');
        const inputId = makeInputId(form.formId, this.id);
        
        const node = this.MakeInputNode(form);
        node.setAttribute('purpose', 'solo');


        divNode.appendChild(this.MakeLabel(this.label, inputId));
        divNode.appendChild(node);
        divNode.appendChild(document.createElement("br"));

        return divNode;
    }

    MakeInputNode(form) {
        const node = document.createElement("input");

        node.type = "text";
        node.id = makeInputId(form.formId, this.id);
        node.value = this.value;

        return node;
    }

    AddChangeHandler(form, func) {
        document.getElementById(
            makeInputId(form.formId, this.id)
        ).addEventListener("change", func);

        return this;
    }
}

class Vec2InputScheme extends InputSchemeBase {
    constructor(numberInputScheme1, numberInputScheme2) {
        super();
        this.numberInputScheme1 = numberInputScheme1;
        this.numberInputScheme2 = numberInputScheme2;
    }

    Build(id, label, changeFunc) {
        return new Vec2Input(id, label != undefined ? label : this.label, this, changeFunc);
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
        node1.classList.add('shortNumberInput');
        const node2 = this.numberObject2.MakeInputNode(form);
        node2.classList.add('shortNumberInput');

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


class ScienceNumberInputScheme extends InputSchemeBase {
    constructor(value=0, units='', step=1, min=null, max=null, minExponent=null, maxExponent=null) {
        super();
        this.value = value;
        this.units = units;
        this.step = step;
        this.min = min;
        this.max = max;
        this.minExponent = minExponent;
        this.maxExponent = maxExponent;
    }

    Build(id, label, changeFunc) {
        return new ScienceNumberInput(id, label != undefined ? label : this.label, this, changeFunc);
    }
}


class ScienceNumberInput extends InputBase {
    constructor(id, label, scienceNumberInputScheme) {
        super();
        this.id = id;
        this.label = label;
        this.units = scienceNumberInputScheme.units;

        let [m, e] = toScientificNotationTuple(scienceNumberInputScheme.value);

        this.mantissaObject = new NumberInputScheme(
            m,
            '',
            scienceNumberInputScheme.step,
            scienceNumberInputScheme.min,
            scienceNumberInputScheme.max,
        ).Build(id + '-mantissa', '');
        this.exponentObject = new NumberInputScheme(
            e,
            '',
            1,
            scienceNumberInputScheme.minExponent,
            scienceNumberInputScheme.maxExponent,
        ).Build(id + '-exponent', '');
    }

    get type() { return "scienceNumber"; }

    get key() { return this.id; }

    get groupId() { return this.id; }

    GetValue(formId) {
        const m = this.mantissaObject.GetValue(formId);
        const e = this.exponentObject.GetValue(formId);
        
        return m === null || e === null ? null : m * Math.pow(10, e);
    }

    SetValue(formId, value) {
        let [m, e] = toScientificNotationTuple(value);

        this.mantissaObject.SetValue(formId, m);
        this.exponentObject.SetValue(formId, e);
    }

    BuildNode(form) {
        const divNode = document.createElement('div');

        const inputId = makeInputId(form.formId, this.id);
        const node1 = this.mantissaObject.MakeInputNode(form);
        node1.classList.add('shortNumberInput');
        const node2 = this.exponentObject.MakeInputNode(form);
        node2.classList.add('shortNumberInput');

        divNode.appendChild(this.MakeLabel(this.label, inputId));
        divNode.appendChild(node1);
        divNode.appendChild(spanFactory(' x 10^'));
        divNode.appendChild(node2);
        divNode.appendChild(
            this.MakeLabel(
                this.units, 
                makeInputId(form.formId, this.exponentObject.id), 
                'units'
            )
        );;
        divNode.appendChild(document.createElement("br"));

        return divNode;
    }

    AddChangeHandler(form, func) {
        this.mantissaObject.AddChangeHandler(form, func);
        this.exponentObject.AddChangeHandler(form, func);

        return this;
    }
}

class ListInputScheme extends InputSchemeBase {
    constructor(inputScheme) {
        super();
        this.inputScheme = inputScheme;
    }

    Build(id, label) {
        return new ListInput(id, label != undefined ? label : this.label, this);
    }
}

class ListInput extends InputBase {
    constructor(id, label, listInputScheme) {
        super();
        this.id = id;
        this.label = label;
        this.inputScheme = listInputScheme.inputScheme;

        this.inputObjects = [];
        this.changeHandlers = [];
        this.values = [];
        this.addButtonText = 'addButtonText';
        this.removeButtonText = 'removeButtonText';
    }

    get type() { return "list"; }

    get key() { return this.id; }

    get groupId() { return this.id; }

    CreateNewInputObject() {
        this.inputObjects.push(this.inputScheme.Build(this.id + '-' + this.inputObjects.length));
    }

    RemoveInputObject(index) {
        this.inputObjects.splice(index, 1);
        
    }

    GetValue(formId) {
        return this.inputObjects.map((v) => v.GetValue(formId));
    }

    SetValue(formId, value) {
        this.inputObjects.forEach((v, i) => {
            if (i < value.length) {
                this.values[i] = value[i];
                v.SetValue(formId, value[i]);
            }
        });
    }

    Reload(form) {
        this.values = this.GetValue(form.formId);

        for (let i = 0; i < this.inputObjects.length; i++) {
            this.inputObjects[i] = this.inputScheme.Build(this.id + '-' + i)
        } 

        const divId = makeInputId(form.formId, this.id) + '-div';

        const divNode = document.getElementById(divId);
        divNode.innerHTML = '';

        this._buildNode(form, divNode);

        this.inputObjects.forEach((inputObject, i) => {
            this.changeHandlers.forEach((func) => {
                inputObject.AddChangeHandler(form, func);
            });
        });

        this.SetValue(form.formId, this.values);

        if (typeof MathJax !== undefined) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        }
    }

    WithAddButtonText(text) {
        this.addButtonText = text;
        return this;
    }

    WithRemoveButtonText(text) {
        this.removeButtonText = text;
        return this;
    }

    _buildNode(form, divNode) {
        const inputId = makeInputId(form.formId, this.id);

        divNode.appendChild(this.MakeLabel(this.label, inputId));

        const addButton = document.createElement('button');
        addButton.innerText = this.addButtonText;
        addButton.id = inputId + '-addButton';

        let t = this;
        addButton.onclick = (e) => { t.CreateNewInputObject(); t.Reload(form); };

        divNode.appendChild(addButton);
        divNode.appendChild(document.createElement('hr'));

        this.inputObjects.forEach((inputObject, i) => {
            divNode.appendChild(inputObject.BuildNode(form));

            const removeButton = document.createElement('button');
            removeButton.innerText = this.removeButtonText;
            removeButton.id = inputId + `-removeButton${i}`;
            removeButton.onclick = (e) => { t.RemoveInputObject(i); t.Reload(form); };

            divNode.appendChild(removeButton);
            divNode.appendChild(document.createElement('hr'));
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
        this.changeHandlers.push(func);

        return this;
    }

}

class CompoundInputScheme extends InputSchemeBase {
    constructor(inputScheme) {
        super(); 
        this.inputScheme = inputScheme;
    }

    Build(id, label) {
        return new CompoundInput(id, label != undefined ? label : this.label, this);
    }

}


class CompoundInput extends InputBase {
    constructor(id, label, compoundInputScheme) {
        super();
        this.id = id;
        this.label = label;
        this.inputScheme = compoundInputScheme.inputScheme;

        this.inputObjects = {};

        for (let i in this.inputScheme) {
            this.inputObjects[i] = this.inputScheme[i].Build(this.id + '-' + i);
        }
    }

    get type() { return "compound"; }

    get key() { return this.id; }

    get groupId() { return this.id; }

    GetValue(formId) {
        let values = {};

        for (let i in this.inputObjects) {
            values[i] = this.inputObjects[i].GetValue(formId);
        }

        return values;
    }

    SetValue(formId, valueObject) {
        for (let i in this.inputObjects) {
            if (valueObject[i] != undefined)
                this.inputObjects[i].SetValue(formId, valueObject[i]);
        }
    }

    BuildNode(form) {
        const inputId = makeInputId(form.formId, this.id);
        const divNode = document.createElement('div');
        divNode.id = inputId + '-div';

        divNode.appendChild(this.MakeLabel(this.label, inputId));

        Object.values(this.inputObjects).forEach((inputObject) => {
            divNode.appendChild(inputObject.BuildNode(form));
        });

        return divNode;
    }

    AddChangeHandler(form, func) {
        Object.values(this.inputObjects).forEach((inputObject) => {
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
        return this.AddInputObject(radioObject);
    }
    
    AddCheckbox(checkboxObject) {
        return this.AddInputObject(checkboxObject);
    }

    AddNumber(number) {
        return this.AddInputObject(number);
    }

    AddInputObject(input) {
        this.DOMObject.appendChild(input.BuildNode(this));

        input.AddChangeHandler(this, input.func);

        this.inputObjects.push(input);
        return this;
    }

    AddVec2(vec2Object) {
        return this.AddInputObject(vec2Object);
    }

    AddParagraph(text) {
        const node = document.createElement('p');
        node.innerHTML = text;
        this.DOMObject.append(node);

        return this;
    }

    AddChildForm(form) {
        const node = document.createElement("div");

        node.id = form.formId;
        node.classList.add("childForm");

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(document.createElement("br"));

        this.childForms.push(form);
        return this;
    }

    AddSubmitButton(id, label, func) {
        const node = document.createElement("button");

        node.id = `${this.formId}-${id}`;
        node.type = "submit";
        node.innerHTML = label;

        this.DOMObject.appendChild(node);
        this.DOMObject.appendChild(document.createElement("br"));
        
        this.DOMObject.onsubmit = (e) => {
            e.preventDefault();
            func(this.GetValues());
        };

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
        for (let form of this.childForms) {
            if (document.getElementById(form.formId)) {
                form.GetValues(values);
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

    ConnectInputs(id1, id2, func1To2, func2To1=null) {
        const input1 = this.inputObjects.find((v) => v.id == id1);
        const input2 = this.inputObjects.find((v) => v.id == id2);
        if (input1 === null || input2 === null) {
            return this;
        }

        const formId = this.formId;

        input1.AddChangeHandler(this, (e) => {
            input2.SetValue(formId, func1To2(input1.GetValue(formId)));
        });
        if (func2To1) {
            input2.AddChangeHandler(this, (e) => {
                input1.SetValue(formId, func2To1(input2.GetValue(formId)));
            });
        }

        return this;
    }

    GetElement(id) {
        return document.getElementById(makeInputId(this.formId, id));
    }
}
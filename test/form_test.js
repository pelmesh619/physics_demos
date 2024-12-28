function main() {
    var coordinatesSystemForm = new FormMaker("myForm");

    coordinatesSystemForm
    .AddRadio(
        new RadioInput("isometric", "outputProjection", "Изометрическая", true)
    )
    .AddRadio(
        new RadioInput("dimetric", "outputProjection", "Диметрическая")
    ).AddRadio(
        new RadioInput("cartesian", "coordinatesType", "Прямоугольная система", true, updateCoordinatesValuesForm)
    ).AddRadio(
        new RadioInput("cylindical", "coordinatesType", "Цилиндрическая система", false, updateCoordinatesValuesForm)
    ).AddRadio(
        new RadioInput("spherical", "coordinatesType", "Сферическая система", false, updateCoordinatesValuesForm)
    ).AddChildForm("coordinatesValuesForm")
    .AddChildForm("coordinatesOutputForm")
    .AddSubmitButton("submit", "Подтвердить", (v) => { window.alert(JSON.stringify(v)); })
    .AddCheckbox(new CheckboxInput("otherParams", "stop", "Остановить симуляцию?"))
    .AddVec2(new Vec2Input('someVector', 'Мой вектор', new NumberDomain(0, 'м'), new NumberDomain(0, 'м')));

    updateCoordinatesValuesForm();
}

function updateCoordinatesValuesForm(e) {
    const coordinatesSystemForm = new FormMaker("myForm");
    const valuesType = coordinatesSystemForm.GetValues()["coordinatesType"];
    const coordinatesValuesFrom = new FormMaker("coordinatesValuesForm").Clear();

    if (valuesType == "cartesian") {
        coordinatesValuesFrom
        .AddNumber(new NumberInput("x", "x = ", new NumberDomain(0, "м", 0.001)))
        .AddNumber(new NumberInput("y", "y = ", new NumberDomain(0, "м", 0.001)))
        .AddNumber(new NumberInput("z", "z = ", new NumberDomain(0, "м", 0.001)))
    } else if (valuesType == "cylindical") {
        coordinatesValuesFrom
        .AddNumber(new NumberInput("r", "r = ", new NumberDomain(0, "м", 0.001)))
        .AddNumber(new NumberInput("phi", "phi = ", new NumberDomain(0, "rad", 0.001)))
        .AddNumber(new NumberInput("phi_deg", "", new NumberDomain(0, "deg", 0.001)))
        .AddNumber(new NumberInput("z", "z = ", new NumberDomain(0, "м", 0.001)))
        .ConnectNumbers('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; })
    } else if (valuesType == "spherical") {
        coordinatesValuesFrom
        .AddNumber(new NumberInput("r", "r = ", new NumberDomain(0, "м", 0.001)))
        .AddNumber(new NumberInput("phi", "phi = ", new NumberDomain(0, "rad", 0.001)))
        .AddNumber(new NumberInput("phi_deg", "", new NumberDomain(0, "deg", 0.001)))
        .AddNumber(new NumberInput("theta", "theta = ", new NumberDomain(0, "rad", 0.001)))
        .AddNumber(new NumberInput("theta_deg", "", new NumberDomain(0, "deg", 0.001)))
        .ConnectNumbers('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; })
        .ConnectNumbers('theta', 'theta_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; });
    }
}

window.onload = main;

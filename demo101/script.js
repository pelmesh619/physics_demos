function main() {
    var coordinatesSystemForm = new FormMaker("coordinatesSystemForm");

    coordinatesSystemForm.AddParagraph("Из системы:")
    .AddRadio(
        new RadioInput("cartesian", "coordinatesType", "прямоугольной", true, updateCoordinatesValuesForm)
    ).AddRadio(
        new RadioInput("cylindical", "coordinatesType", "цилиндрической", false, updateCoordinatesValuesForm)
    ).AddRadio(
        new RadioInput("spherical", "coordinatesType", "сферической", false, updateCoordinatesValuesForm)
    ).AddChildForm("coordinatesValuesForm")
    .AddChildForm("coordinatesOutputForm")
    .AddSubmitButton("submit", "Подтвердить", (v) => { window.alert(JSON.stringify(v)); })
    .AddCheckbox(new CheckboxInput("otherParams", "stop", "Остановить симуляцию?"));

    updateCoordinatesValuesForm();
}

function updateCoordinatesValuesForm(e) {
    const coordinatesSystemForm = new FormMaker("coordinatesSystemForm");
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

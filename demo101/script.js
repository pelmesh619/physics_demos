function main() {
    var coordinatesSystemForm = new FormMaker("coordinatesSystemForm");

    coordinatesSystemForm
    .AddRadio(
        "outputProjection", 
        new RadioInput("isometric", "Изометрическая", true)
    )
    .AddRadio(
        "outputProjection", 
        new RadioInput("dimetric", "Диметрическая")
    ).AddRadio(
        "coordinatesType", 
        new RadioInput("cartesian", "Прямоугольная система", true, updateCoordinatesValuesForm)
    ).AddRadio(
        "coordinatesType", 
        new RadioInput("cylindical", "Цилиндрическая система", false, updateCoordinatesValuesForm)
    ).AddRadio(
        "coordinatesType", 
        new RadioInput("spherical", "Сферическая система", false, updateCoordinatesValuesForm)
    ).AddChildForm("coordinatesValuesForm")
    .AddChildForm("coordinatesOutputForm")
    .AddSubmitButton("submit", "Подтвердить", (v) => { console.log(v); })
    .AddCheckbox("otherParams", new CheckboxInput("stop", "Остановить симуляцию?"));
}

function updateCoordinatesValuesForm(e) {
    const coordinatesSystemForm = new FormMaker("coordinatesSystemForm");
    const valuesType = coordinatesSystemForm.GetValues()["coordinatesType"];
    const coordinatesValuesFrom = new FormMaker("coordinatesValuesForm").Clear();

    if (valuesType == "cartesian") {
        coordinatesValuesFrom
        .AddNumber("coordinatesValues", new NumberInput("x", "x = ", "м"))
        .AddNumber("coordinatesValues", new NumberInput("y", "y = ", "м"))
        .AddNumber("coordinatesValues", new NumberInput("z", "z = ", "м"))
    } else if (valuesType == "cylindical") {
        coordinatesValuesFrom
        .AddNumber("coordinatesValues", new NumberInput("r", "r = ", "м"))
        .AddNumber("coordinatesValues", new NumberInput("phi", "phi = ", "rad"))
        .AddNumber("coordinatesValues", new NumberInput("z", "z = ", "м"))
    } else if (valuesType == "spherical") {
        coordinatesValuesFrom
        .AddNumber("coordinatesValues", new NumberInput("r", "r = ", "м"))
        .AddNumber("coordinatesValues", new NumberInput("phi", "phi = ", "rad"))
        .AddNumber("coordinatesValues", new NumberInput("theta", "theta = ", "rad"));
    }

    
}

window.onload = main;

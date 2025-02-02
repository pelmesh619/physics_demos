const borderWidth = 20;

class Main {
    constructor(form) {
        this.form = form;
    }

    reloadModel() {
        const values = this.form.GetValues();

        // implement
    }

}

function main() {
    var form = new FormMaker("mainForm");

    form
    .AddInputObject(new StringInputScheme("x").Build("func_x", "\\( F_x \\) = "))
    .AddInputObject(new StringInputScheme("y").Build("func_y", "\\( F_y \\) = "))
    .AddSubmitButton('submitButton', "Перестроить график", () => { mainObject.reloadModel(); });


    var mainObject = new Main(form);

    
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    mainObject.reloadModel();
}



window.onload = main;

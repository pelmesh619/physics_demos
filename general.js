class HintTextShower {
    static _enable = false;

    static get enable() {
        return HintTextShower._enable;
    }

    static set enable(value) {
        if (value) {
            document.getElementById('hintText').style.display = "block";
            document.getElementById('hintIcon').classList.add('activeHintIcon');
            HintTextShower._enable = true;
        } else {
            document.getElementById('hintText').style.display = "none";
            document.getElementById('hintIcon').classList.remove('activeHintIcon');
            HintTextShower._enable = false;
        }
    }

    static showModelInfo() {
        if (!HintTextShower.enable) {
            document.getElementById('hintText').style.display = "block";
            document.getElementById('hintIcon').classList.add('activeHintIcon');
        }
    }

    static hideModelInfo() {
        if (!HintTextShower.enable) {
            document.getElementById('hintText').style.display = "none";
            document.getElementById('hintIcon').classList.remove('activeHintIcon');
        }
    }
}

function downloadData(filename, data) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

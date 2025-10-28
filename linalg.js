class WrongDimensionsError extends Error {
    constructor(message) {
        super(message);
        this.name = "WrongDimensionsError";
    }
}

class IndexError extends Error {
    constructor(message) {
        super(message);
        this.name = "IndexError";
    }
}


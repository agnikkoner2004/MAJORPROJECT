class ExpressError extends Error {
    constructor( statuscode,message) {
        super();
        this.message = message;
        this.statuscode = statuscode;
    }
}

module.exports = ExpressError;
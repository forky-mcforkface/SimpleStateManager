function State(options) {
    this.id = options.id || makeID();
    this.query = options.query || 'all';
    // These are exposed as part of the state, not options so delete before
    // we merge these into default options.
    delete options.id;
    delete options.query;

    var defaultOptions = {
        onEnter: [],
        onLeave: [],
        onResize: [],
        onFirstRun: []
    };

    //Merge options with defaults to make the state
    this.options = mergeOptions(defaultOptions, options);

    //Migrate methods into an array, this is to enable future functionality of adding extra methods to an existing state
    if (typeof this.options.onEnter === "function") {
        this.options.onEnter = [this.options.onEnter];
    }

    if (typeof this.options.onLeave === "function") {
        this.options.onLeave = [this.options.onLeave];
    }

    if (typeof this.options.onResize === "function") {
        this.options.onResize = [this.options.onResize];
    }

    if (typeof this.options.onFirstRun === "function") {
        this.options.onFirstRun = [this.options.onFirstRun];
    }

    //Test the one time tests first, if the test is invalid we wont create the config option
    if (this.testConfigOptions('once') === false) {
        this.valid = false;
        return false;
    }

    this.valid = true;
    this.active = false;
    this.init();
}

State.prototype = {
    init: function init() {
        this.test = window.matchMedia(this.query);

        if (this.test.matches && this.testConfigOptions('match')) {
            this.enterState();
        }

        this.listener = function (test) {
            var changed = false;

            if (test.matches) {
                if (this.testConfigOptions('match')) {
                    this.enterState();
                    changed = true;
                }
            } else {
                this.leaveState();
                changed = true;
            }

            if (changed) {
                stateChangeMethod();
            }
        }.bind(this);

        this.test.addListener(this.listener);
    },

    //Handle entering a state
    enterState: function enterState() {
        fireAllMethodsInArray(this.options.onFirstRun);
        fireAllMethodsInArray(this.options.onEnter);
        this.options.onFirstRun = [];
        this.active = true;
    },

    //Handle leaving a state
    leaveState: function leaveState() {
        fireAllMethodsInArray(this.options.onLeave);
        this.active = false;
    },

    //Handle the user resizing the browser
    resizeState: function resizeState() {
        if (this.testConfigOptions('resize')) {
            fireAllMethodsInArray(this.options.onResize);
        }
    },

    //When the StateManager removes a state we want to remove the event listener
    destroy: function destroy() {
        this.test.removeListener(this.listener);
    },

    attachCallback: function attachCallback(type, callback, runIfActive) {
        switch (type) {
            case 'enter':
                this.options.onEnter.push(callback);
                break;
            case 'leave':
                this.options.onLeave.push(callback);
                break;
            case 'resize':
                this.options.onResize.push(callback);
                break;
        }

        if (type === 'enter' && runIfActive && this.active) {
            callback();
        }
    },

    testConfigOptions: function testConfigOptions(when) {
        var totalConfigOptions = this.configOptions.length;

        for (var j = 0; j < totalConfigOptions; j++) {
            var configOption = this.configOptions[j];

            if (typeof this.options[configOption.name] !== "undefined") {
                if (configOption.when === when && configOption.test.bind(this)() === false) {
                    return false;
                }
            }
        }

        return true;
    },

    //An array of avaliable config options, this can be pushed to by the State Manager
    configOptions: []
};

export default State;
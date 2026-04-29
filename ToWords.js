(function(global) {
    function ToWords(options) {
        this.options = Object.assign({
            localeCode: 'en-IN',
            converterOptions: {
                currency: false,
                ignoreDecimal: false,
                ignoreZeroCurrency: false,
                doNotAddOnly: false
            }
        }, options);
        this.locale = new (global.Locales[this.options.localeCode])();
    }

    // Expose ToWords to the global scope
    global.ToWords = ToWords;

    ToWords.prototype.convert = function(number, options) {
        options = Object.assign({}, this.options.converterOptions, options);
        if (isNaN(number)) throw new Error("Invalid Number");

        var words = options.currency
            ? this.convertCurrency(number, options)
            : this.convertNumber(number);

        return words.join(' ');
    };

    ToWords.prototype.convertNumber = function(number) {
        var locale = this.locale;
        var words = [];
        if (number < 0) {
            words.push(locale.config.texts.minus);
            number = Math.abs(number);
        }
        var split = number.toString().split('.');
        words = this.convertInternal(parseInt(split[0]));

        if (split.length > 1) {
            words.push(locale.config.texts.point);
            for (var i = 0; i < split[1].length; i++) {
                words.push(this.convertInternal(parseInt(split[1][i]))[0]);
            }
        }

        return words;
    };

    ToWords.prototype.convertCurrency = function(number, options) {
        var locale = this.locale;
        var config = locale.config.currency;
        var words = [];

        if (number < 0) {
            words.push(locale.config.texts.minus);
            number = Math.abs(number);
        }

        var parts = number.toFixed(2).split('.');
        var intPart = parseInt(parts[0]);
        var decPart = parseInt(parts[1]);

        if (intPart > 0) {
            words = this.convertInternal(intPart);
            words.push(intPart === 1 ? config.singular : config.plural);
        }

        if (decPart > 0) {
            words.push(locale.config.texts.and);
            words = words.concat(this.convertInternal(decPart));
            words.push(decPart === 1 ? config.fractionalUnit.singular : config.fractionalUnit.plural);
        }

        words.push(locale.config.texts.only);
        return words;
    };

    ToWords.prototype.convertInternal = function(number) {
        var map = this.locale.config.numberWordsMapping;
        var words = [];

        if (number === 0) return [map[map.length - 1].value];

        for (var i = 0; i < map.length; i++) {
            var entry = map[i];
            if (number >= entry.number) {
                if (entry.number < 100) {
                    words.push(entry.value);
                    number -= entry.number;
                    if (number > 0) {
                        words = words.concat(this.convertInternal(number));
                    }
                    break;
                } else {
                    var quotient = Math.floor(number / entry.number);
                    var remainder = number % entry.number;
                    words = words.concat(this.convertInternal(quotient));
                    words.push(entry.value);
                    if (remainder > 0) {
                        words = words.concat(this.convertInternal(remainder));
                    }
                    break;
                }
            }
        }
        return words;
    };
})(this);

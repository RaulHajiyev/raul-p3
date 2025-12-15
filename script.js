// Currency Converter Application
const API_URL = 'https://api.exchangerate.host/convert';
const ACCESS_KEY = '6de00240f2b45aaead509f69ab5614ba';

class CurrencyConverter {
    constructor() {
        this.leftCurrency = 'RUB';
        this.rightCurrency = 'USD';
        this.leftAmount = 5000;
        this.rightAmount = 0;
        this.exchangeRate = null;
        this.isUpdating = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialConversion();
    }

    setupEventListeners() {
        // Currency buttons
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currency = e.target.dataset.currency;
                const panel = e.target.closest('.converter-panel');
                
                if (panel.querySelector('.panel-label').textContent === 'У меня есть') {
                    this.setLeftCurrency(currency);
                } else {
                    this.setRightCurrency(currency);
                }
            });
        });

        // Amount inputs
        const leftInput = document.getElementById('leftAmount');
        const rightInput = document.getElementById('rightAmount');

        leftInput.addEventListener('input', (e) => {
            if (this.isUpdating) return;
            this.handleLeftInputChange(e.target.value);
        });

        rightInput.addEventListener('input', (e) => {
            if (this.isUpdating) return;
            this.handleRightInputChange(e.target.value);
        });

        // Prevent non-numeric input (except dot and comma)
        leftInput.addEventListener('keypress', (e) => {
            if (!/[0-9.,]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                e.preventDefault();
            }
        });

        rightInput.addEventListener('keypress', (e) => {
            if (!/[0-9.,]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    setLeftCurrency(currency) {
        this.leftCurrency = currency;
        this.updateCurrencyButtons('left', currency);
        this.convert();
    }

    setRightCurrency(currency) {
        this.rightCurrency = currency;
        this.updateCurrencyButtons('right', currency);
        this.convert();
    }

    updateCurrencyButtons(side, currency) {
        const panel = side === 'left' 
            ? document.querySelector('.converter-panel:first-child')
            : document.querySelector('.converter-panel:last-child');
        
        panel.querySelectorAll('.currency-btn').forEach(btn => {
            if (btn.dataset.currency === currency) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    handleLeftInputChange(value) {
        // Replace comma with dot
        value = value.replace(',', '.');
        
        // Remove spaces for parsing
        const valueForParsing = value.replace(/\s/g, '');
        
        // Remove invalid characters
        const cleanedValue = valueForParsing.replace(/[^0-9.]/g, '');
        
        // Prevent multiple dots
        const parts = cleanedValue.split('.');
        let finalValue = cleanedValue;
        if (parts.length > 2) {
            finalValue = parts[0] + '.' + parts.slice(1).join('');
        }

        let numValue = finalValue === '' || finalValue === '.' ? 0 : parseFloat(finalValue);
        if (isNaN(numValue)) {
            numValue = 0;
        }
        this.leftAmount = numValue;
        
        this.isUpdating = true;
        document.getElementById('leftAmount').value = this.formatNumber(numValue);
        this.convertFromLeft();
        this.isUpdating = false;
    }

    handleRightInputChange(value) {
        // Replace comma with dot
        value = value.replace(',', '.');
        
        // Remove spaces for parsing
        const valueForParsing = value.replace(/\s/g, '');
        
        // Remove invalid characters
        const cleanedValue = valueForParsing.replace(/[^0-9.]/g, '');
        
        // Prevent multiple dots
        const parts = cleanedValue.split('.');
        let finalValue = cleanedValue;
        if (parts.length > 2) {
            finalValue = parts[0] + '.' + parts.slice(1).join('');
        }

        let numValue = finalValue === '' || finalValue === '.' ? 0 : parseFloat(finalValue);
        if (isNaN(numValue)) {
            numValue = 0;
        }
        this.rightAmount = numValue;
        
        this.isUpdating = true;
        document.getElementById('rightAmount').value = this.formatNumber(numValue);
        this.convertFromRight();
        this.isUpdating = false;
    }

    formatNumber(num) {
        if (isNaN(num) || num === 0) return '0';
        // Format with space as thousand separator
        const parts = num.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join('.');
    }

    async loadInitialConversion() {
        // Format initial left amount
        this.isUpdating = true;
        document.getElementById('leftAmount').value = this.formatNumber(this.leftAmount);
        this.isUpdating = false;
        await this.convert();
    }

    async convert() {
        // If same currency, don't make API call
        if (this.leftCurrency === this.rightCurrency) {
            this.rightAmount = this.leftAmount;
            this.isUpdating = true;
            document.getElementById('rightAmount').value = this.formatNumber(this.rightAmount);
            document.getElementById('leftRate').textContent = `1 ${this.leftCurrency} = 1 ${this.rightCurrency}`;
            document.getElementById('rightRate').textContent = `1 ${this.rightCurrency} = 1 ${this.leftCurrency}`;
            this.isUpdating = false;
            this.hideError();
            return;
        }

        try {
            this.hideError();
            const rate = await this.fetchExchangeRate(this.leftCurrency, this.rightCurrency);
            this.exchangeRate = rate;
            
            this.convertFromLeft();
            this.updateRateDisplay();
        } catch (error) {
            this.showError('Ошибка при получении данных о курсе валют. Пожалуйста, проверьте подключение к интернету.');
            console.error('Conversion error:', error);
        }
    }

    convertFromLeft() {
        if (this.leftCurrency === this.rightCurrency) {
            this.rightAmount = this.leftAmount;
        } else if (this.exchangeRate !== null) {
            this.rightAmount = this.leftAmount * this.exchangeRate;
        }
        
        this.isUpdating = true;
        document.getElementById('rightAmount').value = this.formatNumber(this.rightAmount);
        this.isUpdating = false;
    }

    convertFromRight() {
        if (this.leftCurrency === this.rightCurrency) {
            this.leftAmount = this.rightAmount;
        } else if (this.exchangeRate !== null) {
            this.leftAmount = this.rightAmount / this.exchangeRate;
        }
        
        this.isUpdating = true;
        document.getElementById('leftAmount').value = this.formatNumber(this.leftAmount);
        this.isUpdating = false;
    }

    updateRateDisplay() {
        if (this.leftCurrency === this.rightCurrency) {
            document.getElementById('leftRate').textContent = `1 ${this.leftCurrency} = 1 ${this.rightCurrency}`;
            document.getElementById('rightRate').textContent = `1 ${this.rightCurrency} = 1 ${this.leftCurrency}`;
            return;
        }

        if (this.exchangeRate !== null) {
            const inverseRate = 1 / this.exchangeRate;
            document.getElementById('leftRate').textContent = `1 ${this.leftCurrency} = ${this.exchangeRate.toFixed(4)} ${this.rightCurrency}`;
            document.getElementById('rightRate').textContent = `1 ${this.rightCurrency} = ${inverseRate.toFixed(4)} ${this.leftCurrency}`;
        }
    }

    async fetchExchangeRate(from, to) {
        // Use the convert endpoint with amount=1 to obtain the rate even on free plans
        const url = `${API_URL}?access_key=${ACCESS_KEY}&from=${from}&to=${to}&amount=1`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Check for API errors
            if (data.error || data.success === false) {
                const info = data?.error?.info || 'Unknown API error';
                throw new Error(info);
            }
            
            // The convert endpoint returns the converted amount as result for amount=1
            const rate = typeof data.result === 'number'
                ? data.result
                : (data.info && typeof data.info.quote === 'number' ? data.info.quote : null);
            
            if (rate === null) {
                throw new Error('Exchange rate not found');
            }
            
            return rate;
        } catch (error) {
            // Check if it's a network error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to the server');
            }
            throw error;
        }
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    hideError() {
        const errorElement = document.getElementById('errorMessage');
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});


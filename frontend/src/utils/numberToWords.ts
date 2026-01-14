/**
 * Convert a number to Spanish words for Guatemalan Quetzales
 * Example: 350.00 -> "TRECIENTOS CINCUENTA QUETZALES CON 00/100"
 */

const UNITS = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const TENS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const TEENS = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const HUNDREDS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function convertHundreds(num: number): string {
  if (num === 0) return '';
  if (num === 100) return 'CIEN';

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  let result = HUNDREDS[hundred];

  if (remainder > 0) {
    if (result) result += ' ';
    result += convertTens(remainder);
  }

  return result;
}

function convertTens(num: number): string {
  if (num === 0) return '';
  if (num < 10) return UNITS[num];
  if (num >= 10 && num < 20) return TEENS[num - 10];

  const ten = Math.floor(num / 10);
  const unit = num % 10;

  if (unit === 0) {
    return TENS[ten];
  }

  // Special case for 21-29 (veintiuno, veintidós, etc.)
  if (ten === 2) {
    return 'VEINTI' + UNITS[unit];
  }

  return TENS[ten] + ' Y ' + UNITS[unit];
}

function convertThousands(num: number): string {
  if (num === 0) return '';
  if (num === 1000) return 'MIL';

  const thousand = Math.floor(num / 1000);
  const remainder = num % 1000;

  let result = '';

  if (thousand === 1) {
    result = 'MIL';
  } else if (thousand > 1) {
    result = convertHundreds(thousand) + ' MIL';
  }

  if (remainder > 0) {
    if (result) result += ' ';
    result += convertHundreds(remainder);
  }

  return result;
}

export function numberToWordsSpanish(amount: number): string {
  // Handle zero
  if (amount === 0) {
    return 'CERO QUETZALES CON 00/100';
  }

  // Ensure amount is positive
  const absAmount = Math.abs(amount);

  // Split into integer and decimal parts
  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  // Handle amounts over 999,999.99
  if (integerPart > 999999) {
    return 'CANTIDAD EXCEDE LÍMITE';
  }

  // Convert integer part to words
  let words = '';

  if (integerPart === 0) {
    words = 'CERO';
  } else if (integerPart < 1000) {
    words = convertHundreds(integerPart);
  } else {
    words = convertThousands(integerPart);
  }

  // Handle plural/singular for "QUETZAL/QUETZALES"
  const currency = integerPart === 1 ? 'QUETZAL' : 'QUETZALES';

  // Format decimal part with leading zero if needed
  const decimalStr = decimalPart.toString().padStart(2, '0');

  return `${words} ${currency} CON ${decimalStr}/100`;
}

const ones = [
	"",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven",
	"eight",
	"nine",
	"ten",
	"eleven",
	"twelve",
	"thirteen",
	"fourteen",
	"fifteen",
	"sixteen",
	"seventeen",
	"eighteen",
	"nineteen",
];

const tens = [
	"",
	"",
	"twenty",
	"thirty",
	"forty",
	"fifty",
	"sixty",
	"seventy",
	"eighty",
	"ninety",
];

export function numberToWords(n: number): string {
	if (n === 100) {
		return "one hundred";
	}

	if (n < 20) {
		return ones[n];
	}

	return tens[Math.floor(n / 10)] + (n % 10 ? `-${ones[n % 10]}` : "");
}

/* blinddate+ plans: one source of truth for prices, benefits and plan-only rules.
   Proposed launch pricing in CAD before tax. The demo never takes a payment. */
const Plans = (() => {
  const recordUnlock = 1.99;
  const monthly = {id: 'monthly', name: 'Monthly', price: 29.99, intro: 14.99, credits: 2};
  const annual = {id: 'annual', name: 'Yearly', price: 239.99, credits: 3};
  const money = n => 'C$' + n.toFixed(2);
  const perMonth = plan => plan.id === 'annual' ? plan.price / 12 : plan.price;
  // Saving against twelve full monthly payments, and against a monthly first year that includes the intro month.
  const savingPercent = () => Math.round((1 - annual.price / (monthly.price * 12)) * 100);
  const firstYearMonthly = () => monthly.intro + monthly.price * 11;
  const firstYearSaving = () => Math.floor(firstYearMonthly() - annual.price);

  // [benefit, free, monthly, yearly]
  const comparison = [
    ['Personality-first introductions', 'One at a time', 'Introduced first', 'Introduced first'],
    ['Arranged-date credits each month', '1 to start', String(monthly.credits), String(annual.credits)],
    ['Ratings & show-up record before you meet', money(recordUnlock) + ' each', 'Included', 'Included'],
    ['Stretch age & distance when there’s no one', '—', 'Included', 'Included'],
    ['Free late cancellation', '—', '—', '1 every 3 months'],
    ['Partner restaurant perks', '—', '—', 'Included'],
    ['Price locked while you stay', '—', '—', 'Included'],
    ['Safety check-ins, verification & reporting', 'Free', 'Free', 'Free'],
  ];
  const guarantee = 'No introduction in your first 30 days? You get your first payment back.';

  const isMember = state => ['monthly', 'annual'].includes(state?.previewPlan);
  const isYearly = state => state?.previewPlan === 'annual';
  const waiverDays = 90;
  // Yearly members may cancel late once every 90 days without the fee. It still counts on their record,
  // because the person they cancelled on was still let down.
  function waiverAvailable(state, now = Date.now()) {
    if (!isYearly(state)) return false;
    const last = Number(state.waiverUsedAt) || 0;
    return !last || now - last >= waiverDays * 86400000;
  }
  return {recordUnlock, monthly, annual, money, perMonth, savingPercent, firstYearMonthly, firstYearSaving, comparison, guarantee, isMember, isYearly, waiverDays, waiverAvailable};
})();

export function calculateRatingSummary(reviews = []) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      average: 0,
      count: 0,
      distribution,
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  let sum = 0;
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
    distribution[star] = (distribution[star] || 0) + 1;
    sum += Number(r.rating) || 0;
  }

  const count = reviews.length;
  const average = Math.round((sum / count) * 10) / 10;
  const percentages = {
    1: Math.round(((distribution[1] || 0) / count) * 100),
    2: Math.round(((distribution[2] || 0) / count) * 100),
    3: Math.round(((distribution[3] || 0) / count) * 100),
    4: Math.round(((distribution[4] || 0) / count) * 100),
    5: Math.round(((distribution[5] || 0) / count) * 100),
  };

  return { average, count, distribution, percentages };
}

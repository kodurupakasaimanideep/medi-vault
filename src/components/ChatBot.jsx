import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2, RotateCcw } from 'lucide-react';
import './ChatBot.css';

const GEMINI_API_KEY = 'AIzaSyC0IA41R_v8RnJUH-pznjuoNCncs4FeOX8';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Yoga Knowledge Base ──────────────────────────────────────────
const YOGA_KB = [
  {
    keywords: ['anulom vilom', 'alternate nostril', 'nadi shodhana'],
    answer: `**🌬️ Anulom Vilom (Alternate Nostril Breathing)**

**How to do it:**
1. Sit in Padmasana or Sukhasana with spine straight
2. Place right thumb on right nostril, ring finger on left nostril
3. Close right nostril with thumb — inhale slowly through left nostril (4 counts)
4. Close both nostrils, hold breath (8 counts)
5. Release thumb, exhale through right nostril (8 counts)
6. Inhale through right nostril (4 counts), hold (8 counts), exhale through left (8 counts)
7. This completes 1 cycle. Do 10–20 cycles.

**Benefits:**
- Balances the nervous system (Ida & Pingala nadis)
- Reduces stress, anxiety, and blood pressure
- Improves lung capacity and oxygenation
- Enhances focus and mental clarity
- Excellent for hypertension and heart health

**Duration:** 5–10 minutes daily, best done on empty stomach in the morning.
**Contraindications:** Avoid during fever or acute cold.`
  },
  {
    keywords: ['kapalbhati', 'skull shining', 'forceful exhalation'],
    answer: `**🔥 Kapalbhati Pranayama (Skull Shining Breath)**

**How to do it:**
1. Sit comfortably with spine erect
2. Inhale deeply through both nostrils
3. Exhale forcefully through the nose — the belly pulls inward sharply
4. Inhalation is passive and automatic
5. Start with 30 strokes/minute, gradually increase to 60–120

**Benefits:**
- Detoxifies the body by expelling CO2
- Strengthens abdominal muscles
- Improves digestion and metabolism
- Reduces belly fat over time
- Energizes the mind and body
- Helps with diabetes by stimulating pancreas

**Duration:** Start with 3 rounds of 30 strokes. Build to 5–10 minutes.

**Contraindications:** Avoid if pregnant, have high BP, epilepsy, hernia, or recent surgery.`
  },
  {
    keywords: ['bhramari', 'humming bee', 'bee breath'],
    answer: `**🐝 Bhramari Pranayama (Humming Bee Breath)**

**How to do it:**
1. Sit comfortably, close eyes
2. Place thumbs over ears, index fingers on forehead, middle & ring fingers over closed eyes
3. Inhale deeply through both nostrils
4. Exhale slowly while making a low-pitched humming sound like a bee: "Mmmm"
5. Feel the vibration resonate in your head and chest
6. Do 5–10 rounds

**Benefits:**
- Instantly calms the nervous system
- Reduces anxiety, anger, and mental tension
- Lowers blood pressure
- Improves concentration and memory
- Helps with insomnia and migraines
- Stimulates the vagus nerve (parasympathetic response)

**Best for:** Stress relief, before sleep, and emotional regulation.`
  },
  {
    keywords: ['surya namaskar', 'sun salutation', 'sun salute'],
    answer: `**☀️ Surya Namaskar (Sun Salutation) — 12 Steps**

1. **Pranamasana** — Prayer pose, hands at heart center
2. **Hastauttanasana** — Raised arms pose, arch back
3. **Hastapadasana** — Standing forward bend
4. **Ashwa Sanchalanasana** — Equestrian/lunge pose (right leg back)
5. **Dandasana** — Plank pose
6. **Ashtanga Namaskara** — Eight-limbed pose (knees-chest-chin)
7. **Bhujangasana** — Cobra pose
8. **Adho Mukha Svanasana** — Downward-facing dog
9. **Ashwa Sanchalanasana** — Equestrian pose (left leg back)
10. **Hastapadasana** — Standing forward bend
11. **Hastauttanasana** — Raised arms
12. **Pranamasana** — Prayer pose

**Benefits:**
- Full-body workout in 12 minutes (12 rounds)
- Burns 13–14 calories per round
- Improves flexibility, strength, and circulation
- Balances hormones and metabolism

**Tip:** Inhale on expansive poses, exhale on contracting poses.`
  },
  {
    keywords: ['warrior', 'virabhadrasana', 'warrior pose'],
    answer: `**⚔️ Warrior Poses (Virabhadrasana)**

**Warrior I (Virabhadrasana I):**
- Front foot forward, back foot at 45°
- Bend front knee to 90°, raise arms overhead
- Strengthens: legs, core, shoulders
- Benefits: improves focus, builds strength and stability

**Warrior II (Virabhadrasana II):**
- Front foot forward, back foot perpendicular
- Arms extended parallel to floor, gaze over front hand
- Strengthens: thighs, hips, arms
- Benefits: builds stamina and concentration

**Warrior III (Virabhadrasana III):**
- Balance on one leg, body parallel to floor
- Arms stretched forward
- Strengthens: back, legs, core
- Benefits: improves balance and coordination

**Hold each pose:** 30–60 seconds per side, 3 rounds.`
  },
  {
    keywords: ['pranayama', 'breathing exercise', 'breath control', 'breathing technique'],
    answer: `**🌬️ Complete Pranayama Guide**

| Pranayama | Benefit | Duration |
|---|---|---|
| Anulom Vilom | Stress relief, balance | 5–10 min |
| Kapalbhati | Detox, metabolism | 5–10 min |
| Bhramari | Anxiety, sleep | 5 min |
| Ujjayi | Focus, calm | 5–10 min |
| Sheetali | Cools body, BP | 5 min |
| Bhastrika | Energy, lungs | 3 min |
| Nadi Shodhana | Balance nervous system | 10 min |

**Best sequence for beginners:**
1. Anulom Vilom (5 min)
2. Bhramari (5 min)
3. Kapalbhati (5 min)

**Best time:** Early morning on an empty stomach, or evening 3–4 hours after meals.`
  },
  {
    keywords: ['back pain', 'lower back', 'spine', 'backache'],
    answer: `**🧘 Yoga for Back Pain Relief**

**Best Asanas:**
1. **Balasana (Child’s Pose)** — Gently stretches lower back. Hold 60 sec.
2. **Marjariasana-Bitilasana (Cat-Cow)** — Mobilizes spine. 10 rounds.
3. **Setu Bandhasana (Bridge Pose)** — Strengthens back muscles. Hold 30 sec.
4. **Bhujangasana (Cobra Pose)** — Strengthens spine extensors. Hold 20–30 sec.
5. **Pawanmuktasana (Wind-Relieving Pose)** — Releases lower back tension. Hold each side 30 sec.
6. **Supta Matsyendrasana (Supine Twist)** — Releases tight back muscles.

**Daily Routine (15 min):**
- Cat-Cow: 2 min
- Child’s Pose: 2 min
- Bridge Pose: 2 min
- Cobra: 2 min
- Supine Twist: 2 min each side

**Avoid if severe:** Consult a doctor before starting if you have a herniated disc.`
  },
  {
    keywords: ['beginner', 'start yoga', 'yoga for beginners', 'new to yoga'],
    answer: `**🌱 Yoga for Beginners — Complete Starter Guide**

**Essential Poses to Learn First:**
1. **Tadasana (Mountain Pose)** — Foundation of all standing poses
2. **Balasana (Child’s Pose)** — Rest and reset anytime
3. **Adho Mukha Svanasana (Downward Dog)** — Full body stretch
4. **Virabhadrasana I & II** — Warrior poses for strength
5. **Setu Bandhasana (Bridge)** — Backbend and core strength
6. **Savasana (Corpse Pose)** — Final relaxation (NEVER skip!)

**Beginner Pranayama:**
- Start with Anulom Vilom (5 min)
- Add Bhramari (3 min)
- Progress to Kapalbhati after 2 weeks

**Tips:**
- Practice 20–30 min daily, consistency beats duration
- Never force a pose — yoga is not about pain
- Breathe through the nose always
- Empty stomach (2 hours after food)
- Use a non-slip yoga mat`
  },
  {
    keywords: ['flexibility', 'stretch', 'stretching', 'tight muscles'],
    answer: `**🤸 Yoga for Flexibility**

**Top Poses for Full-Body Flexibility:**
- **Uttanasana** (Forward fold) — Hamstrings, calves
- **Trikonasana** (Triangle) — Hips, thighs, spine
- **Gomukhasana** (Cow Face) — Shoulders, hips
- **Pigeon Pose** — Deep hip flexors
- **Paschimottanasana** (Seated Forward Fold) — Entire back body
- **Anjaneyasana** (Low Lunge) — Hip flexors and quads

**Rules for Safe Stretching:**
- Hold each pose 30–60 seconds minimum
- Never bounce in a stretch
- Breathe deeply — exhale deepens the stretch
- Warm up first (Cat-Cow, Sun Salutations)
- Practice daily for noticeable improvement in 4–6 weeks`
  },
  {
    keywords: ['meditation', 'mindfulness', 'dhyana', 'concentrate'],
    answer: `**🧘‍♂️ Yoga Meditation (Dhyana) Guide**

**Simple 10-Minute Meditation:**
1. Sit in Sukhasana or Padmasana, spine tall
2. Close eyes, hands in Gyan Mudra (index+thumb touching)
3. Take 5 deep belly breaths to settle
4. Focus on your breath — notice inhalation and exhalation
5. When mind wanders, gently return focus to breath
6. Gradually expand awareness to the whole body
7. End with 3 deep breaths and slowly open eyes

**Types of Meditation in Yoga:**
- **Trataka** — Candle gazing for focus
- **So Hum** — Mantra meditation (inhale “So”, exhale “Hum”)
- **Yoga Nidra** — Yogic sleep for deep relaxation
- **Body Scan** — Progressive relaxation

**Benefits:** Reduces cortisol by 20%, improves focus, sleep quality, and emotional regulation.`
  },
  {
    keywords: ['yoga stress', 'anxiety', 'calm', 'relaxation', 'stress relief'],
    answer: `**🌿 Yoga for Stress & Anxiety Relief**

**Most Effective Poses:**
1. **Viparita Karani** (Legs up the wall) — Activates parasympathetic nervous system
2. **Balasana** (Child’s Pose) — Grounds and calms the mind
3. **Supta Baddha Konasana** (Reclining Butterfly) — Opens chest and heart
4. **Savasana with Yoga Nidra** — Profound relaxation
5. **Uttanasana** (Forward fold) — Calms the brain

**Pranayama for Anxiety:**
- **Bhramari** (Bee Breath) — Most effective for immediate calm
- **4-7-8 Breathing** — Inhale 4, hold 7, exhale 8 seconds
- **Box Breathing** — Inhale 4, hold 4, exhale 4, hold 4

**5-Minute Emergency Routine:**
- Bhramari: 5 rounds
- Legs up the wall: 3 minutes
- Child’s pose: 2 minutes`
  },
  {
    keywords: ['morning yoga', 'morning routine', 'wake up yoga'],
    answer: `**🌅 Morning Yoga Routine (20 Minutes)**

**1. Gentle Wake-Up (3 min)**
- Cat-Cow stretch: 10 rounds
- Neck rolls: 5 each direction

**2. Sun Salutations (8 min)**
- 4–6 rounds of Surya Namaskar
- Builds heat and activates full body

**3. Standing Sequence (5 min)**
- Warrior I — 30 sec each side
- Warrior II — 30 sec each side
- Triangle Pose — 30 sec each side

**4. Cool Down (4 min)**
- Seated forward fold: 60 sec
- Supine twist: 60 sec each side
- Savasana: 2 min

**Pranayama to add:**
- Kapalbhati 3 min BEFORE asanas
- Anulom Vilom 5 min AFTER asanas

**Best time:** 6–7 AM on empty stomach`
  },
  {
    keywords: ['savasana', 'corpse pose', 'relaxation pose', 'final pose'],
    answer: `**🧘 Savasana (Corpse Pose) — The Most Important Pose**

**How to do it:**
1. Lie flat on your back, legs slightly apart
2. Arms at sides, palms facing up
3. Close eyes, let feet fall outward
4. Consciously relax each body part from toes to head
5. Breathe naturally, let go of all muscle tension
6. Stay 5–15 minutes

**Why it matters:**
- The body integrates all the benefits of the practice
- Activates the parasympathetic nervous system
- Cortisol levels drop significantly
- Without Savasana, up to 40% of yoga benefits are lost

**Common mistake:** Leaving before Savasana to “save time.” This is counterproductive!

**Yoga Nidra variation:** Guide yourself through a body scan from toes to head while in Savasana for deeper relaxation.`
  },
];

function getYogaAnswer(userText) {
  const lower = userText.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of YOGA_KB) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (best && bestScore > 0) return best.answer;
  return null;
}

// ─── Local Diet Knowledge Fallback ──────────────────────────────────────────
const DIET_KB = [
  {
    keywords: ['protein', 'high protein', 'protein breakfast', 'protein food', 'protein rich', 'protein meal'],
    answer: `**🥚 High-Protein Foods & Meals**

Here are excellent protein sources:

**Breakfast Ideas:**
- Eggs (6g protein each) – boiled, scrambled, or omelette
- Greek yogurt (15–20g per cup) with nuts
- Paneer bhurji (300–400 cal, 20g protein)
- Sprouts salad with peanuts
- Protein oats with milk and chia seeds

**High-Protein Foods:**
- Chicken breast (31g/100g) 🍗
- Lentils/Dal (9g/100g cooked)
- Eggs (13g/100g)
- Tofu / Soya chunks (15–20g/100g)
- Cottage cheese / Paneer (18g/100g)
- Fish (20–25g/100g)
- Chickpeas/Chana (15g/100g)

**Daily Tip:** Aim for 0.8–1.2g of protein per kg of body weight. For muscle gain, go up to 1.6–2g/kg.`
  },
  {
    keywords: ['weight loss', 'lose weight', 'reduce weight', 'fat loss', 'slim', 'slimming', 'cut calories'],
    answer: `**🔥 Effective Weight Loss Tips**

**Diet Rules:**
- Create a 300–500 calorie daily deficit
- Eat more protein to stay full longer
- Cut refined sugar, white rice, maida
- Drink 2.5–3L water daily
- Avoid processed/packaged foods

**Sample Day Plan (1400–1600 cal):**
- Morning: 2 boiled eggs + 1 fruit
- Breakfast: Oats with low-fat milk
- Lunch: Brown rice + dal + salad
- Snack: Handful of nuts + green tea
- Dinner: Grilled chicken/tofu + vegetables

**Key Habits:**
- Walk 8,000–10,000 steps daily 🚶
- Sleep 7–8 hours (poor sleep = weight gain)
- Eat slowly and mindfully
- Avoid eating after 8 PM

**Foods to Avoid:** Sugary drinks, fried snacks, white bread, alcohol.`
  },
  {
    keywords: ['weight gain', 'gain weight', 'bulk', 'muscle gain', 'underweight', 'increase weight'],
    answer: `**💪 Healthy Weight Gain Plan**

**Goal:** Eat 300–500 calories MORE than you burn daily.

**Top Calorie-Dense Healthy Foods:**
- Peanut butter (180 cal/2 tbsp)
- Banana + milk shake
- Avocado (240 cal each)
- Brown rice + rajma
- Dry fruits – almonds, cashews, raisins
- Whole eggs (70 cal each)
- Full-fat dairy – milk, paneer, curd

**Sample High-Calorie Day (2500–3000 cal):**
- Morning: Banana shake (milk + banana + oats + peanut butter)
- Breakfast: 4 eggs + 2 whole grain toast + 1 glass milk
- Lunch: 2 cups brown rice + chicken curry + salad
- Snack: Handful of mixed nuts + 1 fruit
- Dinner: Paneer/chicken + roti + dal + vegetables

**Exercise:** Strength training 3–4x/week builds lean muscle, not just fat.`
  },
  {
    keywords: ['calorie', 'calories', 'caloric', 'how many calories', 'calorie count'],
    answer: `**📊 Calorie Guide**

**Daily Calorie Needs (approximate):**
- Sedentary adult: 1800–2000 cal
- Moderately active: 2000–2400 cal
- Very active / athlete: 2500–3000 cal

**Common Foods Calorie Chart:**
| Food | Calories |
|---|---|
| 1 Roti | ~70 cal |
| 1 cup cooked rice | ~200 cal |
| 2 eggs (boiled) | ~140 cal |
| 100g chicken breast | ~165 cal |
| 1 cup dal (cooked) | ~120 cal |
| 1 banana | ~90 cal |
| 1 cup full-fat milk | ~150 cal |
| 1 tbsp ghee | ~112 cal |
| 1 cup oats (cooked) | ~150 cal |

**Formula for your TDEE:**
Weight (kg) × 22–25 = approximate daily calorie need (light activity).`
  },
  {
    keywords: ['meal plan', 'diet plan', 'weekly plan', 'monthly plan', '7 day', 'diet chart', 'what to eat'],
    answer: `**📅 7-Day Balanced Diet Plan**

**Monday:**
- B: Oats + milk + banana | L: Dal + rice + salad | D: Grilled chicken + roti + veggies

**Tuesday:**
- B: Eggs omelette + toast | L: Rajma + brown rice | D: Paneer sabzi + roti

**Wednesday:**
- B: Poha + green tea | L: Chole + roti | D: Fish curry + rice + salad

**Thursday:**
- B: Greek yogurt + fruits + granola | L: Dal + rice + cucumber | D: Soya chunks curry + roti

**Friday:**
- B: Idli (3) + sambar | L: Mixed veggie rice + dal | D: Grilled chicken + salad

**Saturday:**
- B: Smoothie bowl (banana, oats, milk, nuts) | L: Brown rice + chana | D: Egg curry + roti

**Sunday:**
- B: Whole grain pancakes + honey | L: Pulao + raita + salad | D: Grilled fish/tofu + veggies

**Snacks (any day):** Fruits, nuts, seeds, buttermilk, sprouts.`
  },
  {
    keywords: ['vitamin', 'vitamins', 'minerals', 'iron', 'calcium', 'vitamin d', 'vitamin c', 'b12', 'deficiency'],
    answer: `**💊 Vitamins & Minerals Guide**

**Vitamin D:**
- Sources: Sunlight ☀️, fatty fish, egg yolk, mushrooms
- Deficiency signs: Fatigue, bone pain, low immunity

**Vitamin C:**
- Sources: Amla, lemon, oranges, guava, bell pepper
- Benefits: Immunity, skin, iron absorption

**Vitamin B12:**
- Sources: Eggs, milk, meat, fish (vegans may need supplements)
- Deficiency: Fatigue, nerve issues, anemia

**Iron:**
- Sources: Spinach, lentils, meat, jaggery, beans
- Tip: Eat with Vitamin C to boost absorption

**Calcium:**
- Sources: Milk, curd, paneer, sesame seeds, ragi
- Daily need: 1000mg for adults

**Magnesium:**
- Sources: Nuts, seeds, dark chocolate, leafy greens
- Benefits: Sleep, muscle function, stress reduction`
  },
  {
    keywords: ['breakfast', 'morning meal', 'what to eat in morning', 'healthy breakfast'],
    answer: `**🌅 Healthy Breakfast Ideas**

**Quick Options (under 15 min):**
- 2 boiled eggs + 1 fruit + black coffee
- Overnight oats with chia seeds + berries
- Peanut butter on whole grain toast + banana

**Filling Options:**
- Eggs omelette with vegetables + whole grain toast
- Poha with peas and peanuts + green tea
- Idli (3) + sambar + coconut chutney
- Paneer bhurji + 2 rotis

**Smoothies:**
- Banana + oats + milk + honey
- Spinach + banana + dates + almond milk
- Greek yogurt + mango + granola

**Rule:** Never skip breakfast! It kickstarts metabolism and prevents overeating later.`
  },
  {
    keywords: ['lunch', 'midday meal', 'healthy lunch'],
    answer: `**🍱 Healthy Lunch Ideas**

**Balanced Lunch Plate:**
- 50% vegetables/salad
- 25% complex carbs (brown rice, roti)
- 25% protein (dal, chicken, tofu, chana)

**Indian Lunch Options:**
- Dal + 2 rotis + sabzi + salad + curd
- Rajma chawal + onion salad + raita
- Chole + brown rice + cucumber
- Khichdi + curd + papad

**Quick Lunch Bowls:**
- Brown rice + stir-fried veggies + paneer
- Quinoa salad with chickpeas + lemon dressing
- Whole grain wrap with grilled chicken/tofu + salad

**Tip:** Eat lunch at the same time daily for better metabolism.`
  },
  {
    keywords: ['dinner', 'evening meal', 'healthy dinner', 'night meal'],
    answer: `**🌙 Healthy Dinner Ideas**

**Rule:** Keep dinner lighter than lunch. Eat 2–3 hours before sleep.

**Light & Nutritious Options:**
- Grilled chicken/fish + steamed vegetables
- Dal + 1–2 rotis + salad (no rice at night)
- Vegetable soup + multigrain bread
- Egg omelette + salad
- Paneer/tofu stir-fry + chapati

**Avoid at Night:**
- Heavy fried foods
- Large portions of rice or maida
- Sugary desserts
- Caffeine (tea, coffee)

**Bedtime Snack (if hungry):** A small cup of warm milk with turmeric or a handful of nuts.`
  },
  {
    keywords: ['snack', 'snacks', 'healthy snack', 'between meals', 'mid-meal'],
    answer: `**🥜 Healthy Snack Ideas**

**Under 150 calories:**
- Handful of mixed nuts (almonds, walnuts)
- 1 fruit (apple, banana, orange)
- 1 cup buttermilk / chaas
- Sprouts with lemon and salt
- 2 rice cakes with peanut butter

**Under 250 calories:**
- Greek yogurt with honey
- Boiled egg with black pepper
- Hummus with carrot/cucumber sticks
- Roasted chana (1 cup)
- Fruit and nut mix

**Timing:** Snack every 3–4 hours between main meals to maintain stable blood sugar and energy levels.`
  },
  {
    keywords: ['water', 'hydration', 'drink water', 'how much water', 'dehydration'],
    answer: `**💧 Hydration Guide**

**Daily Water Intake:**
- Sedentary adults: 2–2.5 litres/day
- Active individuals: 3–4 litres/day
- Athletes: Up to 5 litres (depending on sweat)

**Signs of Dehydration:**
- Dark yellow urine 🟡
- Headaches, fatigue
- Dizziness
- Dry skin and lips

**Hydrating Foods:**
- Watermelon, cucumber, oranges, coconut water
- Soups, broths, smoothies

**Tips:**
- Start your day with 2 glasses of water
- Drink a glass 30 min before each meal
- Carry a water bottle everywhere
- Avoid sugary drinks (soda, juices) — use water or coconut water instead

**Electrolytes:** After heavy exercise, have coconut water or a pinch of salt + lemon in water.`
  },
  {
    keywords: ['diabetes', 'diabetic diet', 'blood sugar', 'sugar control', 'low glycemic'],
    answer: `**🩸 Diabetic-Friendly Diet Tips**

**Foods to EAT:**
- Non-starchy vegetables: spinach, broccoli, cauliflower
- Whole grains: brown rice, oats, barley, millets (ragi, jowar)
- Legumes: lentils, chana, rajma
- Fruits (in moderation): guava, berries, papaya
- Lean protein: eggs, chicken breast, fish, tofu

**Foods to AVOID:**
- White rice, maida (refined flour), white bread
- Sugary drinks, sweets, mithai
- Deep-fried foods
- Processed snacks

**Portion Control:**
- Eat smaller meals every 3–4 hours instead of 3 large meals
- Use the Plate Method: half veggies, quarter protein, quarter whole grains

**Tip:** Always consult your doctor for a personalized diabetes management plan. 🏥`
  },
  {
    keywords: ['gym', 'gym diet', 'workout nutrition', 'pre workout', 'post workout', 'bodybuilding'],
    answer: `**🏋️ Gym & Workout Nutrition**

**Pre-Workout (1–2 hours before):**
- Banana + peanut butter
- Oats with milk
- Brown rice + chicken
- Whole grain toast + eggs
*Goal: Carbs for energy, some protein*

**Post-Workout (within 30–60 min):**
- Protein shake (whey + milk)
- Greek yogurt + fruits
- Eggs + whole grain toast
- Chicken/Tofu + sweet potato
*Goal: Protein for muscle repair, carbs to replenish glycogen*

**Daily Macro Split (for muscle gain):**
- Protein: 30–35%
- Carbs: 40–45%
- Fats: 20–25%

**Supplements (optional):**
- Creatine monohydrate – proven for strength
- Whey protein – convenient protein source
- Multivitamins – fill nutritional gaps`
  },
  {
    keywords: ['vegetarian', 'vegan', 'plant based', 'no meat', 'plant protein'],
    answer: `**🌱 Vegetarian/Vegan Protein Sources**

**Best Plant Proteins:**
| Food | Protein per 100g |
|---|---|
| Soya chunks | 52g |
| Tofu | 17g |
| Lentils (cooked) | 9g |
| Chickpeas (cooked) | 9g |
| Paneer | 18g |
| Quinoa | 14g |
| Black beans | 9g |
| Peanuts | 26g |
| Hemp seeds | 31g |
| Edamame | 11g |

**Complete Protein Combos:**
- Rice + dal (forms complete amino acid profile)
- Roti + chana
- Oats + milk + peanut butter

**Tip:** Vegans should supplement B12, Vitamin D, and Omega-3 (algae-based).`
  },
  {
    keywords: ['keto', 'ketogenic', 'low carb', 'no carb'],
    answer: `**🥑 Keto / Low-Carb Diet Guide**

**What is Keto?**
A very low-carb, high-fat diet that puts your body in ketosis (burns fat for fuel).

**Macro Split:**
- Fat: 70–75%
- Protein: 20–25%
- Carbs: 5–10% (max 20–50g net carbs/day)

**Keto-Friendly Foods:**
- Meats: chicken, eggs, fish, mutton
- Fats: avocado, coconut oil, ghee, olive oil, nuts
- Vegetables: leafy greens, cauliflower, broccoli, zucchini
- Dairy: cheese, paneer, cream

**AVOID on Keto:**
- Rice, roti, bread, pasta
- Sugar, sweets, fruits (except berries)
- Legumes, beans, most grains

**Who Should Avoid Keto?** People with kidney issues, pregnant women, diabetics on medication — consult a doctor first. 🏥`
  },
  {
    keywords: ['diet', 'nutrition', 'eating', 'food', 'healthy eating', 'balanced diet'],
    answer: `**🥗 Principles of Healthy Eating**

**The 5 Pillars of Good Nutrition:**
1. **Variety** – Eat different colored fruits and vegetables daily
2. **Balance** – Include all macros: carbs, protein, fats
3. **Moderation** – No food is completely off-limits; portion control matters
4. **Timing** – Eat regularly every 3–4 hours; don't skip meals
5. **Hydration** – Drink 2.5–3L water daily

**The Ideal Plate:**
- Half: Vegetables & fruits 🥦🍎
- Quarter: Whole grains (brown rice, oats, millets)
- Quarter: Lean protein (eggs, chicken, dal, paneer)
- Plus: Healthy fats (nuts, olive oil, ghee in moderation)

**Quick Tips:**
- Cook at home as much as possible
- Read food labels before buying packaged foods
- Limit salt to 5g (1 tsp) daily
- Minimize ultra-processed foods

What specific diet topic would you like to know more about? 😊`
  },
];

function getLocalAnswer(userText, systemPromptHint = '') {
  const lower = userText.toLowerCase();
  const isYogaContext = systemPromptHint.toLowerCase().includes('yoga');

  // If we're in yoga context, try yoga KB first
  if (isYogaContext) {
    const yogaAnswer = getYogaAnswer(lower);
    if (yogaAnswer) return yogaAnswer;
  }

  // Try yoga KB regardless of context
  const yogaAns = getYogaAnswer(lower);
  if (yogaAns) return yogaAns;

  // Diet KB
  let best = null;
  let bestScore = 0;
  for (const entry of DIET_KB) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (best && bestScore > 0) return best.answer;

  // Check if yoga context for fallback
  if (isYogaContext) {
    return `**🧘 YogaBot — Your Yoga Expert**

I can help you with:
- 🌬️ **Pranayama** — Anulom Vilom, Kapalbhati, Bhramari
- 🧘 **Asanas** — beginner to advanced poses
- ☀️ **Surya Namaskar** — Sun Salutation steps
- 🛌 **Back pain relief** yoga poses
- 🌅 **Morning yoga** routines
- 💤 **Stress & anxiety** relief through yoga
- 🧠 **Meditation** and mindfulness

Just ask me anything like:
*"How to do Kapalbhati?"* or *"Yoga for back pain"* or *"Morning yoga routine"* 🙏`;
  }

  // Generic fallback
  return `**🤖 MediBot — Health Assistant**

I can help you with:
- 🧘 **Yoga** poses and pranayama
- 🌱 **Diet** and nutrition tips
- 💧 **Hydration** guidance
- 🏋️ **Exercise** routines

What would you like to know? 😊`;
}

const DEFAULT_SYSTEM_PROMPT = `You are MediBot, a friendly and knowledgeable health & wellness AI assistant integrated into the MediVault medical platform. You specialize in:
- Yoga poses, breathing exercises (pranayama), and meditation guidance
- General health and wellness tips
- Diet and nutrition advice
- Exercise recommendations
- Mental health and stress management

Important guidelines:
- Always be warm, encouraging, and supportive
- Provide practical, actionable advice
- If asked about serious medical conditions, recommend consulting a healthcare professional
- Keep responses concise and well-formatted
- Use emojis sparingly to keep the tone friendly
- Never diagnose medical conditions or replace professional medical advice`;

const DEFAULT_WELCOME = "Hi! I'm MediBot 🧘‍♀️ Your personal health & wellness assistant. Ask me anything about yoga, diet, exercise, or general wellness!";

const DEFAULT_QUICK_PROMPTS = [
  "Best yoga poses for beginners?",
  "How to improve flexibility?",
  "Breathing exercises for stress",
  "Post-workout nutrition tips"
];

/**
 * Reusable ChatBot component powered by Gemini API.
 * 
 * Props:
 * - systemPrompt: Custom system prompt for the AI context
 * - welcomeMessage: Initial greeting message
 * - quickPrompts: Array of quick prompt strings
 * - botName: Display name for the bot (default: "MediBot")
 * - accentColor: Primary accent color (default: "#0ea5e9")
 */
export default function ChatBot({
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  welcomeMessage = DEFAULT_WELCOME,
  quickPrompts = DEFAULT_QUICK_PROMPTS,
  botName = "MediBot",
  accentColor = "#0ea5e9",
  apiKey = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [retryPayload, setRetryPayload] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    setHasNewMessage(false);
  }, []);

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsTyping(false);
    setRetryPayload(null);
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! How can I help you today? 🧘‍♀️",
        timestamp: new Date()
      }
    ]);
  }, []);

  const callGeminiAPI = useCallback(async (conversationHistory) => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const activeApiKey = apiKey || GEMINI_API_KEY;
    const activeApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeApiKey}`;

    const requestBody = {
      contents: conversationHistory,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    // --- Try Gemini API once (no long retries to avoid blocking) ---
    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch(activeApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (response.ok) {
        const data = await response.json();
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (botReply) return botReply;
      }

      // If API failed (quota, key issue, etc.), fall through to local fallback
      const status = response.status;
      const isFatal = status === 400 || status === 401 || status === 403 || status === 404 || status === 429;
      if (isFatal) {
        console.warn(`Gemini API returned ${status}. Using local knowledge base.`);
        // Use local fallback
        const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop();
        const userText = lastUserMsg?.parts?.[0]?.text || '';
        return getLocalAnswer(userText, systemPrompt);
      }

      throw new Error(`API error ${status}`);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      // Network errors or any other failure → use local fallback
      console.warn('Gemini API unavailable. Using local knowledge base. Error:', error.message);
      const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop();
      const userText = lastUserMsg?.parts?.[0]?.text || '';
      return getLocalAnswer(userText, systemPrompt);
    }
  }, [systemPrompt, apiKey]);

  // Shared helper: call API with given messages and append response
  const _callAndAppendResponse = useCallback(async (allMessages) => {
    setIsTyping(true);
    setRetryPayload(null);

    try {
      const conversationHistory = allMessages
        .filter(m => m.role !== 'system' && !m.isError)
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const botReply = await callGeminiAPI(conversationHistory);
      const assistantMessage = { role: 'assistant', content: botReply, timestamp: new Date() };
      setMessages(prev => [...prev.filter(m => !m.isError), assistantMessage]);

      if (!isOpen) {
        setHasNewMessage(true);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('Gemini API error:', error);

      const is429 = error.message.includes('429');
      const errorMsg = is429
        ? "I'm getting too many requests right now. Please wait a moment and try again."
        : error.message.includes('403')
          ? "API access issue. Please check your API key configuration."
          : "Sorry, I'm having trouble connecting right now. Please try again.";

      setMessages(prev => [...prev.filter(m => !m.isError), {
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
        isError: true
      }]);

      // Save last user text for retry
      const lastUserMsg = allMessages.filter(m => m.role === 'user').pop();
      if (lastUserMsg) setRetryPayload(lastUserMsg.content);
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  }, [isOpen, callGeminiAPI]);

  const sendMessage = useCallback(async (directText) => {
    const trimmed = (directText || input).trim();
    if (!trimmed || isTyping) return;

    const userMessage = { role: 'user', content: trimmed, timestamp: new Date() };
    const updatedMessages = [...messages.filter(m => !m.isError), userMessage];
    setMessages(updatedMessages);
    setInput('');

    await _callAndAppendResponse(updatedMessages);
  }, [input, isTyping, messages, _callAndAppendResponse]);

  const retryLastMessage = useCallback(async () => {
    if (!retryPayload || isTyping) return;

    // Remove error messages but keep the user message that's already there
    const cleanMessages = messages.filter(m => !m.isError);
    setMessages(cleanMessages);

    // Small delay before retry to help with rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));

    await _callAndAppendResponse(cleanMessages);
  }, [retryPayload, isTyping, messages, _callAndAppendResponse]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Markdown-like formatting with list support
  const formatContent = (text) => {
    let formatted = text;
    // Code blocks (must come before other formatting)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // Bullet lists
    formatted = formatted.replace(/^[-•]\s+(.+)/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // Numbered lists
    formatted = formatted.replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>');
    // Cleanup duplicate nested <ul> tags
    formatted = formatted.replace(/<\/ul>\s*<ul>/g, '');
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');
    // Cleanup <br/> inside <ul>
    formatted = formatted.replace(/<br\/><ul>/g, '<ul>');
    formatted = formatted.replace(/<\/ul><br\/>/g, '</ul>');
    return formatted;
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'chatbot-toggle--open' : ''}`}
        onClick={toggleChat}
        aria-label="Toggle chat"
        id="chatbot-toggle-btn"
        style={!isOpen ? { background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` } : {}}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <>
            <MessageCircle size={24} />
            {hasNewMessage && <span className="chatbot-notification-dot" />}
          </>
        )}
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'chatbot-window--open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-avatar" style={{ background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` }}>
              <Bot size={20} />
            </div>
            <div className="chatbot-header-info">
              <h4>{botName}</h4>
              <span className="chatbot-status">
                <span className="chatbot-status-dot" />
                Online
              </span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button className="chatbot-clear-btn" onClick={clearChat} title="Clear chat">
              <Trash2 size={16} />
            </button>
            <button className="chatbot-close-btn" onClick={toggleChat} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-body" ref={chatBodyRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chatbot-msg chatbot-msg--${msg.role} ${msg.isError ? 'chatbot-msg--error' : ''}`}>
              <div className="chatbot-msg-avatar">
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="chatbot-msg-bubble">
                <div
                  className="chatbot-msg-text"
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
                <span className="chatbot-msg-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="chatbot-msg chatbot-msg--assistant">
              <div className="chatbot-msg-avatar">
                <Bot size={16} />
              </div>
              <div className="chatbot-msg-bubble chatbot-typing-bubble">
                <div className="chatbot-typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts (show only at start) */}
        {messages.length <= 1 && !isTyping && (
          <div className="chatbot-quick-prompts">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                className="chatbot-quick-btn"
                onClick={() => sendMessage(prompt)}
              >
                <Sparkles size={12} /> {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Retry button */}
        {retryPayload && !isTyping && (
          <div className="chatbot-retry-bar">
            <button className="chatbot-retry-btn" onClick={retryLastMessage}>
              <RotateCcw size={14} /> Retry last message
            </button>
          </div>
        )}

        {/* Input */}
        <div className="chatbot-footer">
          <div className="chatbot-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              id="chatbot-input"
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              id="chatbot-send-btn"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` }}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="chatbot-disclaimer">{botName} may make mistakes. Consult a doctor for medical advice.</p>
        </div>
      </div>
    </>
  );
}

import { useState, useMemo, useEffect } from 'react';
import './DietPlan.css';
import { Edit2, Trash2, Plus, Save, X, Utensils, Info } from 'lucide-react';
import ChatBot from '../components/ChatBot';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';
import { DIET_T, FOOD_T, LOCALIZED_DIET_PLANS, LOCALIZED_DIET_TIPS, LOCALIZED_VITAMINS } from './DietPlanTranslations';

// ── DATA ────────────────────────────────────────────────────────────────────────

const GYM_FOODS = [
  // Animal-Based
  { id: 'g1', name: 'Chicken Breast', protein: 31, calories: 165, fat: 3.6, fiber: 0, keyNutrients: 'B6, Niacin', benefit: 'Muscle, weight control', star: true, category: 'Animal-Based', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&fit=crop&q=80' },
  { id: 'g2', name: 'Eggs', protein: 13, calories: 155, fat: 11, fiber: 0, keyNutrients: 'B12, Choline', benefit: 'Muscle, brain', star: true, category: 'Animal-Based', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&fit=crop&q=80' },
  { id: 'g3', name: 'Salmon', protein: 22, calories: 208, fat: 13, fiber: 0, keyNutrients: 'Omega-3, D', benefit: 'Heart, brain', star: true, category: 'Animal-Based', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&fit=crop&q=80' },
  { id: 'g4', name: 'Tuna', protein: 25, calories: 132, fat: 1, fiber: 0, keyNutrients: 'B12, Niacin', benefit: 'Fat loss', star: true, category: 'Animal-Based', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=300&fit=crop&q=80' },
  { id: 'g5', name: 'Turkey Breast', protein: 29, calories: 135, fat: 1, fiber: 0, keyNutrients: 'B6', benefit: 'Lean protein', star: false, category: 'Animal-Based', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=300&fit=crop&q=80' },
  { id: 'g6', name: 'Shrimp', protein: 24, calories: 100, fat: 1, fiber: 0, keyNutrients: 'Selenium, Iodine', benefit: 'Low calorie', star: false, category: 'Animal-Based', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&fit=crop&q=80' },
  { id: 'g7', name: 'Pork Tenderloin', protein: 27, calories: 143, fat: 3, fiber: 0, keyNutrients: 'B1', benefit: 'Lean meat', star: false, category: 'Animal-Based', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&fit=crop&q=80' },
  { id: 'g8', name: 'Lean Jerky', protein: 30, calories: 300, fat: 3, fiber: 0, keyNutrients: 'Iron', benefit: 'Snack', star: false, category: 'Animal-Based', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?w=300&fit=crop&q=80' },
  // Dairy & Soy
  { id: 'g9', name: 'Greek Yogurt', protein: 10, calories: 59, fat: 0.4, fiber: 0, keyNutrients: 'Calcium, Probiotics', benefit: 'Gut health', star: true, category: 'Dairy & Soy', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&fit=crop&q=80' },
  { id: 'g10', name: 'Cottage Cheese', protein: 11, calories: 98, fat: 4, fiber: 0, keyNutrients: 'Calcium', benefit: 'Slow protein', star: false, category: 'Dairy & Soy', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&fit=crop&q=80' },
  { id: 'g11', name: 'Tofu', protein: 8, calories: 76, fat: 4, fiber: 1, keyNutrients: 'Calcium', benefit: 'Veg protein', star: true, category: 'Dairy & Soy', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&fit=crop&q=80' },
  { id: 'g12', name: 'Soybeans (Edamame)', protein: 11, calories: 121, fat: 5, fiber: 5, keyNutrients: 'Iron, Fiber', benefit: 'Snack', star: false, category: 'Dairy & Soy', tags: ['High Protein', 'High Fiber'], img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=300&fit=crop&q=80' },
  { id: 'g13', name: 'Cheese', protein: 30, calories: 402, fat: 25, fiber: 0, keyNutrients: 'Calcium, B12', benefit: 'Energy', star: false, category: 'Dairy & Soy', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&fit=crop&q=80' },
  // Plant-Based & Healthy Fats
  { id: 'g14', name: 'Quinoa', protein: 4.4, calories: 120, fat: 1.9, fiber: 2.8, keyNutrients: 'Magnesium', benefit: 'Energy', star: true, category: 'Plant-Based', tags: ['High Fiber'], img: 'https://images.unsplash.com/photo-1586040140378-b5634cb4c8fc?w=300&fit=crop&q=80' },
  { id: 'g15', name: 'Lentils/Beans', protein: 9, calories: 116, fat: 0.4, fiber: 8, keyNutrients: 'Iron, Folate', benefit: 'Digestion', star: false, category: 'Plant-Based', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&fit=crop&q=80' },
  { id: 'g16', name: 'Chickpeas', protein: 19, calories: 364, fat: 6, fiber: 17, keyNutrients: 'Fiber, B9', benefit: 'Energy', star: true, category: 'Plant-Based', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=300&fit=crop&q=80' },
  { id: 'g17', name: 'Almonds', protein: 21, calories: 579, fat: 49, fiber: 12, keyNutrients: 'Vitamin E', benefit: 'Healthy fats', star: true, category: 'Plant-Based', tags: ['High Protein', 'High Fiber'], img: 'https://images.unsplash.com/photo-1574570173583-e0c3e8083f82?w=300&fit=crop&q=80' },
  { id: 'g18', name: 'Walnuts', protein: 15, calories: 654, fat: 65, fiber: 7, keyNutrients: 'Omega-3', benefit: 'Brain', star: false, category: 'Plant-Based', tags: ['High Fiber'], img: 'https://images.unsplash.com/photo-1563412885-6de904a6b8c4?w=300&fit=crop&q=80' },
  { id: 'g19', name: 'Protein Powder', protein: 75, calories: 375, fat: 3, fiber: 0, keyNutrients: 'BCAAs', benefit: 'Recovery', star: true, category: 'Supplements', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&fit=crop&q=80' },
  { id: 'g20', name: 'Brown Rice', protein: 2.6, calories: 123, fat: 1, fiber: 1.8, keyNutrients: 'B vitamins', benefit: 'Carbs', star: false, category: 'Grains', tags: ['Budget'], img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&fit=crop&q=80' },
  { id: 'g21', name: 'Oats', protein: 14, calories: 380, fat: 7, fiber: 10, keyNutrients: 'Beta-glucan', benefit: 'Heart health, energy', star: true, category: 'Grains', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1614961233913-a5113a4a34a2?w=300&fit=crop&q=80' },
  { id: 'g22', name: 'Paneer', protein: 19, calories: 265, fat: 20, fiber: 0, keyNutrients: 'Calcium', benefit: 'Weight + muscle', star: true, category: 'Dairy & Soy', tags: ['High Protein', 'Budget'], img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&fit=crop&q=80' },
  { id: 'g23', name: 'Milk', protein: 3.5, calories: 65, fat: 4, fiber: 0, keyNutrients: 'Calcium, Vitamin D', benefit: 'Balanced nutrition', star: true, category: 'Dairy & Soy', tags: ['Budget'], img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&fit=crop&q=80' },
];

const WEIGHT_GAIN_FOODS = [
  // High-Calorie Fats
  { id: 'wg1', name: 'Ghee', protein: 0, calories: 900, fat: 100, fiber: 0, keyNutrients: 'A, E, K', benefit: 'Add calories easily', star: true, category: 'High-Calorie Fats', tags: [], img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&fit=crop&q=80' },
  { id: 'wg2', name: 'Almonds', protein: 21, calories: 579, fat: 49, fiber: 12, keyNutrients: 'Vitamin E', benefit: 'Healthy fats', star: true, category: 'High-Calorie Fats', tags: ['High Protein', 'High Fiber'], img: 'https://images.unsplash.com/photo-1574570173583-e0c3e8083f82?w=300&fit=crop&q=80' },
  { id: 'wg3', name: 'Walnuts', protein: 15, calories: 654, fat: 65, fiber: 7, keyNutrients: 'Omega-3', benefit: 'Brain', star: true, category: 'High-Calorie Fats', tags: ['High Fiber'], img: 'https://images.unsplash.com/photo-1563412885-6de904a6b8c4?w=300&fit=crop&q=80' },
  { id: 'wg4', name: 'Peanuts', protein: 26, calories: 567, fat: 49, fiber: 8, keyNutrients: 'B3', benefit: 'Budget calories', star: true, category: 'High-Calorie Fats', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=300&fit=crop&q=80' },
  { id: 'wg5', name: 'Cashews', protein: 18, calories: 553, fat: 44, fiber: 3, keyNutrients: 'K, B6', benefit: 'Snacks', star: false, category: 'High-Calorie Fats', tags: [], img: 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=300&fit=crop&q=80' },
  { id: 'wg6', name: 'Avocado', protein: 2, calories: 160, fat: 15, fiber: 7, keyNutrients: 'E, K', benefit: 'Healthy fats', star: false, category: 'High-Calorie Fats', tags: ['High Fiber'], img: 'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=300&fit=crop&q=80' },
  { id: 'wg7', name: 'Dark Chocolate', protein: 7, calories: 598, fat: 42, fiber: 7, keyNutrients: 'Iron', benefit: 'High calorie', star: false, category: 'High-Calorie Fats', tags: ['High Fiber'], img: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300&fit=crop&q=80' },
  // High-Protein Foods
  { id: 'wg8', name: 'Chicken (Leg/Thigh)', protein: 19, calories: 209, fat: 15, fiber: 0, keyNutrients: 'B vitamins', benefit: 'Muscle growth', star: true, category: 'High-Protein', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=300&fit=crop&q=80' },
  { id: 'wg9', name: 'Eggs', protein: 13, calories: 155, fat: 11, fiber: 0, keyNutrients: 'B12, D', benefit: 'Recovery', star: true, category: 'High-Protein', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&fit=crop&q=80' },
  { id: 'wg10', name: 'Paneer', protein: 19, calories: 265, fat: 20, fiber: 0, keyNutrients: 'Calcium', benefit: 'Weight + muscle', star: true, category: 'High-Protein', tags: ['High Protein', 'Budget'], img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&fit=crop&q=80' },
  { id: 'wg11', name: 'Soybean', protein: 36, calories: 446, fat: 20, fiber: 9, keyNutrients: 'Folate', benefit: 'Veg protein', star: true, category: 'High-Protein', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=300&fit=crop&q=80' },
  { id: 'wg12', name: 'Moong Dal', protein: 24, calories: 347, fat: 1, fiber: 8, keyNutrients: 'B-complex', benefit: 'Easy protein', star: true, category: 'High-Protein', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&fit=crop&q=80' },
  { id: 'wg13', name: 'Rajma', protein: 22, calories: 333, fat: 1, fiber: 15, keyNutrients: 'Folate', benefit: 'Fiber + protein', star: false, category: 'High-Protein', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=300&fit=crop&q=80' },
  { id: 'wg14', name: 'Salmon', protein: 20, calories: 208, fat: 13, fiber: 0, keyNutrients: 'D, B12', benefit: 'Omega-3', star: false, category: 'High-Protein', tags: ['High Protein'], img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&fit=crop&q=80' },
  { id: 'wg15', name: 'Whole Milk', protein: 3.5, calories: 65, fat: 4, fiber: 0, keyNutrients: 'A, B', benefit: 'Balanced nutrition', star: false, category: 'High-Protein', tags: ['Budget'], img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&fit=crop&q=80' },
  { id: 'wg16', name: 'Sattu', protein: 20, calories: 387, fat: 7, fiber: 7, keyNutrients: 'B-complex', benefit: 'Energy protein', star: false, category: 'High-Protein', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=300&fit=crop&q=80' },
  // Carbs & Energy
  { id: 'wg17', name: 'White Rice', protein: 6.5, calories: 345, fat: 0.5, fiber: 0, keyNutrients: 'B vitamins', benefit: 'Main energy', star: true, category: 'Carbs & Energy', tags: ['Budget'], img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&fit=crop&q=80' },
  { id: 'wg18', name: 'Oats', protein: 17, calories: 389, fat: 7, fiber: 10, keyNutrients: 'B1', benefit: 'Sustained energy', star: true, category: 'Carbs & Energy', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1614961233913-a5113a4a34a2?w=300&fit=crop&q=80' },
  { id: 'wg19', name: 'Banana', protein: 1.1, calories: 89, fat: 0.3, fiber: 2.6, keyNutrients: 'B6, C', benefit: 'Post-workout', star: true, category: 'Carbs & Energy', tags: ['Budget'], img: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=300&fit=crop&q=80' },
  { id: 'wg20', name: 'Sweet Potato', protein: 1.6, calories: 86, fat: 0.1, fiber: 3, keyNutrients: 'Vitamin A', benefit: 'Slow energy', star: true, category: 'Carbs & Energy', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1596097635121-14b38c5d7a1f?w=300&fit=crop&q=80' },
  { id: 'wg21', name: 'Potatoes', protein: 2, calories: 77, fat: 0.1, fiber: 2, keyNutrients: 'C, B6', benefit: 'Glycogen', star: false, category: 'Carbs & Energy', tags: ['Budget'], img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&fit=crop&q=80' },
  { id: 'wg22', name: 'Ragi', protein: 7, calories: 328, fat: 1.3, fiber: 3, keyNutrients: 'Calcium', benefit: 'Strength', star: false, category: 'Carbs & Energy', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&fit=crop&q=80' },
  { id: 'wg23', name: 'Bajra', protein: 11, calories: 361, fat: 5, fiber: 9, keyNutrients: 'Iron', benefit: 'Energy', star: false, category: 'Carbs & Energy', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&fit=crop&q=80' },
  // Natural Sugar & Quick Energy
  { id: 'wg24', name: 'Dates', protein: 2.5, calories: 282, fat: 0.4, fiber: 7, keyNutrients: 'B-complex', benefit: 'Instant energy', star: true, category: 'Natural Sugar', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=300&fit=crop&q=80' },
  { id: 'wg25', name: 'Raisins', protein: 3, calories: 299, fat: 0.5, fiber: 4, keyNutrients: 'B6', benefit: 'Energy boost', star: true, category: 'Natural Sugar', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?w=300&fit=crop&q=80' },
];

const WEIGHT_LOSS_FOODS = [
  // Whole Grains
  { id: 'wl1', name: 'Oats', protein: 14, calories: 380, fat: 7, fiber: 10, keyNutrients: 'Beta-glucan, heart health', benefit: 'Heart health, sustained energy', star: true, category: 'Whole Grains', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1614961233913-a5113a4a34a2?w=300&fit=crop&q=80' },
  { id: 'wl2', name: 'Dalia (Broken Wheat)', protein: 12, calories: 340, fat: 2, fiber: 11, keyNutrients: 'Digestion, light food', benefit: 'Easy digestion', star: false, category: 'Whole Grains', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&fit=crop&q=80' },
  { id: 'wl3', name: 'Quinoa', protein: 15, calories: 370, fat: 6, fiber: 7, keyNutrients: 'Complete protein, magnesium', benefit: 'Complete protein source', star: true, category: 'Whole Grains', tags: ['High Protein', 'High Fiber'], img: 'https://images.unsplash.com/photo-1586040140378-b5634cb4c8fc?w=300&fit=crop&q=80' },
  { id: 'wl4', name: 'Ragi (Finger Millet)', protein: 7.5, calories: 330, fat: 1.5, fiber: 11, keyNutrients: 'Calcium, iron, digestion', benefit: 'Calcium & digestion', star: false, category: 'Whole Grains', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&fit=crop&q=80' },
  { id: 'wl5', name: 'Bajra (Pearl Millet)', protein: 11, calories: 360, fat: 5, fiber: 9, keyNutrients: 'Iron, satiety', benefit: 'Iron & satiety', star: false, category: 'Whole Grains', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&fit=crop&q=80' },
  { id: 'wl6', name: 'Jowar (Sorghum)', protein: 10, calories: 330, fat: 3, fiber: 9, keyNutrients: 'Gluten-free, weight loss', benefit: 'Gluten-free grain', star: false, category: 'Whole Grains', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&fit=crop&q=80' },
  { id: 'wl7', name: 'Brown Rice', protein: 7.5, calories: 360, fat: 2, fiber: 3.5, keyNutrients: 'Energy, complex carbs', benefit: 'Complex carbs', star: true, category: 'Whole Grains', tags: ['High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&fit=crop&q=80' },
  // Metabolism-Boosting Proteins
  { id: 'wl8', name: 'Eggs (1 whole)', protein: 6.5, calories: 75, fat: 5, fiber: 0, keyNutrients: 'Choline, high-quality protein', benefit: 'High-quality protein', star: true, category: 'Lean Proteins', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&fit=crop&q=80' },
  { id: 'wl9', name: 'Lentils (Dal)', protein: 8.5, calories: 110, fat: 0.5, fiber: 8, keyNutrients: 'Iron, folate, fiber', benefit: 'Iron & fiber', star: true, category: 'Lean Proteins', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&fit=crop&q=80' },
  { id: 'wl10', name: 'Sprouts', protein: 3.5, calories: 30, fat: 0.5, fiber: 4, keyNutrients: 'Vitamin C, metabolism', benefit: 'Boosts metabolism', star: true, category: 'Lean Proteins', tags: ['High Fiber', 'Low Calorie', 'Budget'], img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&fit=crop&q=80' },
  { id: 'wl11', name: 'Chickpeas (Chana)', protein: 19, calories: 360, fat: 6, fiber: 16, keyNutrients: 'Fiber, fullness', benefit: 'Keeps you full', star: true, category: 'Lean Proteins', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=300&fit=crop&q=80' },
  { id: 'wl12', name: 'Soya Chunks', protein: 52, calories: 345, fat: 0.5, fiber: 13, keyNutrients: 'High protein, low fat', benefit: 'Very high protein', star: true, category: 'Lean Proteins', tags: ['High Protein', 'High Fiber', 'Budget'], img: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=300&fit=crop&q=80' },
  { id: 'wl13', name: 'Chicken Breast', protein: 31, calories: 165, fat: 3.6, fiber: 0, keyNutrients: 'Lean muscle protein', benefit: 'Lean muscle', star: true, category: 'Lean Proteins', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&fit=crop&q=80' },
  { id: 'wl14', name: 'Fish (White)', protein: 19, calories: 100, fat: 2, fiber: 0, keyNutrients: 'Omega-3, low fat', benefit: 'Omega-3 & lean protein', star: false, category: 'Lean Proteins', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=300&fit=crop&q=80' },
  { id: 'wl15', name: 'Tofu / Paneer (Low-fat)', protein: 16, calories: 125, fat: 5, fiber: 0, keyNutrients: 'Calcium, protein', benefit: 'Calcium & protein', star: false, category: 'Lean Proteins', tags: ['High Protein', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&fit=crop&q=80' },
  // Fruits & Vegetables
  { id: 'wl16', name: 'Spinach', protein: 2.5, calories: 23, fat: 0.4, fiber: 2, keyNutrients: 'Iron, Vitamin K', benefit: 'Iron & low calorie', star: true, category: 'Fruits & Vegetables', tags: ['High Fiber', 'Low Calorie', 'Budget'], img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&fit=crop&q=80' },
  { id: 'wl17', name: 'Broccoli', protein: 2.5, calories: 34, fat: 0.4, fiber: 2.5, keyNutrients: 'Vitamin C, fiber', benefit: 'Vitamin C & fiber', star: true, category: 'Fruits & Vegetables', tags: ['High Fiber', 'Low Calorie', 'Budget'], img: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&fit=crop&q=80' },
  { id: 'wl18', name: 'Apple', protein: 0.3, calories: 55, fat: 0.2, fiber: 2.5, keyNutrients: 'Fiber, blood sugar control', benefit: 'Blood sugar control', star: true, category: 'Fruits & Vegetables', tags: ['High Fiber', 'Low Calorie', 'Budget'], img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&fit=crop&q=80' },
  { id: 'wl19', name: 'Papaya', protein: 0.5, calories: 40, fat: 0.3, fiber: 1.5, keyNutrients: 'Digestion', benefit: 'Digestion & low calorie', star: false, category: 'Fruits & Vegetables', tags: ['Low Calorie', 'Budget'], img: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=300&fit=crop&q=80' },
  { id: 'wl20', name: 'Strawberries', protein: 0.7, calories: 35, fat: 0.3, fiber: 2, keyNutrients: 'Antioxidants', benefit: 'Antioxidants', star: false, category: 'Fruits & Vegetables', tags: ['High Fiber', 'Low Calorie'], img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&fit=crop&q=80' },
  { id: 'wl21', name: 'Guava', protein: 2.5, calories: 65, fat: 0.9, fiber: 5.5, keyNutrients: 'Very high fiber, Vitamin C', benefit: 'Very high fiber', star: true, category: 'Fruits & Vegetables', tags: ['High Fiber', 'Low Calorie', 'Budget'], img: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=300&fit=crop&q=80' },
];

const GYM_DIET_PLAN = {
  Morning: '🌄 6:00 AM – 1 glass warm water + soaked almonds (5–6) + walnuts (2)',
  Breakfast: '🍳 8:00 AM – 3 boiled eggs + 2 whole wheat bread slices + 1 glass milk or oats with milk',
  Lunch: '🍽️ 1:00 PM – 150g chicken breast / 200g paneer + 1 cup brown rice + dal + salad',
  'Evening Snack': '🥤 5:00 PM – Protein shake / Greek yogurt + banana / ½ cup roasted chickpeas',
  Dinner: '🌙 8:00 PM – 150g grilled fish / chicken / 2 chapatis + 1 cup vegetables + 1 cup dal',
};

const WEIGHT_GAIN_DIET_PLAN = {
  Morning: '🌄 6:30 AM – 1 glass whole milk + 2 dates + 5 soaked almonds + 2 walnuts',
  Breakfast: '🍳 8:30 AM – 4 eggs (2 whole + 2 whites) + 2 chapatis with ghee + 1 banana',
  Lunch: '🍽️ 1:30 PM – 200g paneer / chicken + 2 cups white rice + rajma / moong dal + ghee',
  'Evening Snack': '🥤 5:00 PM – Peanut butter sandwich + 1 glass banana milkshake + handful raisins',
  Dinner: '🌙 9:00 PM – Soybean curry + 2 chapatis + 1 cup brown rice + curd + sweet potato',
};

const WEIGHT_LOSS_DIET_PLAN = {
  Morning: '🌄 6:30 AM – 1 glass warm lemon water + 5 soaked almonds + 2 walnuts',
  Breakfast: '🍳 8:00 AM – Oats porridge with skim milk + 2 egg whites / sprouts salad',
  Lunch: '🍽️ 1:00 PM – Grilled chicken / tofu 100g + 1 cup brown rice / quinoa + salad',
  'Evening Snack': '🍎 5:00 PM – 1 apple / guava + green tea / 1 cup lentil soup',
  Dinner: '🌙 7:30 PM – Grilled fish / soya chunks + 2 chapatis + steamed broccoli + spinach salad',
};

const GYM_TIPS = [
  { icon: '💪', tip: 'Eat 1.6–2.2g protein per kg bodyweight daily for muscle growth.' },
  { icon: '🍗', tip: 'Include a complete protein source in every major meal.' },
  { icon: '⏰', tip: 'Eat within 30–45 min post-workout for optimal muscle recovery.' },
  { icon: '💧', tip: 'Drink at least 3–4 litres of water per day when training.' },
  { icon: '🌾', tip: 'Complex carbs (oats, brown rice) give sustained gym energy.' },
  { icon: '🥚', tip: 'Eggs are nature\'s most complete protein – eat them daily.' },
];

const WEIGHT_GAIN_TIPS = [
  { icon: '📈', tip: 'Maintain a 300–500 kcal daily surplus for steady weight gain.' },
  { icon: '🍌', tip: 'Eat calorie-dense foods like nuts, ghee, and whole milk regularly.' },
  { icon: '🍽️', tip: 'Aim for 5–6 meals per day to pack in extra calories easily.' },
  { icon: '🏋️', tip: 'Combine with strength training to ensure muscle, not just fat gain.' },
  { icon: '💤', tip: 'Sleep 7–9 hours – growth hormone is released during sleep.' },
  { icon: '🥜', tip: 'A handful of peanuts or raisins is an easy 200-calorie snack.' },
];

const WEIGHT_LOSS_TIPS = [
  { icon: '🔥', tip: 'Create a 300–500 kcal deficit for healthy, sustainable fat loss.' },
  { icon: '🥗', tip: 'Fill half your plate with non-starchy vegetables at every meal.' },
  { icon: '💧', tip: 'Drink water 30 min before meals to reduce appetite naturally.' },
  { icon: '🌙', tip: 'Avoid heavy carbs post 7 PM – stick to protein and veggies at night.' },
  { icon: '🚶', tip: 'Add 30 min brisk walking daily to boost fat burning.' },
  { icon: '🍎', tip: 'Snack on fruits and sprouts – they fill you up with minimal calories.' },
];

const ALL_FILTERS = ['High Protein', 'Low Calorie', 'High Fiber', 'Budget'];

const VITAMIN_DATA = [
  { name: 'Vitamin A (Retinol / Beta-carotene)', function: 'Vision, immune health', sources: 'Carrots, sweet potatoes, green leafy vegetables, mangoes, papaya, egg yolk, liver, fortified milk' },
  { name: 'Vitamin B1 (Thiamine)', function: 'Energy metabolism', sources: 'Whole grains, nuts, seeds, pulses, green leafy vegetables' },
  { name: 'Vitamin B2 (Riboflavin)', function: 'Energy metabolism', sources: 'Milk, dairy products, green leafy vegetables, coriander leaves, pulses' },
  { name: 'Vitamin B3 (Niacin)', function: 'Metabolism, skin health', sources: 'Whole grains, peanuts, meat, fish, legumes' },
  { name: 'Vitamin B5 (Pantothenic Acid)', function: 'Metabolism', sources: 'Eggs, liver, broccoli, legumes, nuts' },
  { name: 'Vitamin B6 (Pyridoxine)', function: 'Nervous system, metabolism', sources: 'Cereals, beans, potatoes, vegetables, liver, meat, eggs, bananas' },
  { name: 'Vitamin B7 (Biotin)', function: 'Hair, skin, nails', sources: 'Egg yolks, yeast, nuts, seeds, pork, broccoli, leafy greens' },
  { name: 'Vitamin B9 (Folic Acid)', function: 'Cell division, blood cells', sources: 'Green leafy vegetables, dry fruits, nuts, peas, pulses, liver' },
  { name: 'Vitamin B12 (Cobalamin)', function: 'Nervous system, red blood cells', sources: 'Meat, eggs, milk, cheese, liver, fortified soy beverages, fortified cereals' },
  { name: 'Vitamin C (Ascorbic Acid)', function: 'Immunity, antioxidant', sources: 'Amla, citrus fruits (orange, lemon), guava, tomatoes, green chilies' },
  { name: 'Vitamin D (Calciferol)', function: 'Bone health, immunity', sources: 'Sunlight exposure, cod liver oil, fatty fish, egg yolk, fortified milk/oil' },
  { name: 'Vitamin E (Tocopherol)', function: 'Antioxidant, skin', sources: 'Almonds, seeds, vegetable oils, green leafy vegetables, soybeans' },
  { name: 'Vitamin K (Phylloquinone / K2)', function: 'Blood clotting, bone health', sources: 'Spinach, broccoli, kale, turnip greens, soybeans' },
];

// ── COMPONENT ────────────────────────────────────────────────────────────────────

export default function DietPlan({ user }) {
  const { lang } = useLanguage();
  const dt = (key) => DIET_T[lang]?.[key] || DIET_T['en']?.[key] || key;
  const ft = (text) => FOOD_T[lang]?.[text] || FOOD_T['en']?.[text] || text;

  const [activeSection, setActiveSection] = useState('gym');
  const [activeSubTab, setActiveSubTab] = useState('foods');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [savedItems, setSavedItems] = useState(() => JSON.parse(localStorage.getItem(user?.id ? `mv_saved_items_${user.id}` : 'mv_saved_items') || '[]'));
  const [savedCalories, setSavedCalories] = useState(() => parseInt(localStorage.getItem(user?.id ? `mv_saved_calories_${user.id}` : 'mv_saved_calories') || '0', 10));
  const [savedProtein, setSavedProtein] = useState(() => parseInt(localStorage.getItem(user?.id ? `mv_saved_protein_${user.id}` : 'mv_saved_protein') || '0', 10));
  const [userWeight, setUserWeight] = useState('');
  const [userGoal, setUserGoal] = useState('gym');
  const [dietType, setDietType] = useState('both');
  const [showPersonalized, setShowPersonalized] = useState(false);
  const [toast, setToast] = useState(null);
  const [targetCalories] = useState(2000);
  const [targetProtein] = useState(120);

  // --- PERSISTENT STATE FOR DIET DATA ---
  const [gymFoods, setGymFoods] = useState(GYM_FOODS);
  const [gainFoods, setGainFoods] = useState(WEIGHT_GAIN_FOODS);
  const [lossFoods, setLossFoods] = useState(WEIGHT_LOSS_FOODS);

  const [gymPlan, setGymPlan] = useState(() => LOCALIZED_DIET_PLANS['en'].gym);
  const [gainPlan, setGainPlan] = useState(() => LOCALIZED_DIET_PLANS['en'].gain);
  const [lossPlan, setLossPlan] = useState(() => LOCALIZED_DIET_PLANS['en'].loss);

  // --- MODAL STATES ---
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [editFoodModal, setEditFoodModal] = useState(null); // { mode: 'add'|'edit', food?: object }
  const [editTipsModal, setEditTipsModal] = useState(false);

  // --- PERSISTENT STATE FOR TIPS ---
  const [gymTips, setGymTips] = useState(() => LOCALIZED_DIET_TIPS['en'].gym);
  const [gainTips, setGainTips] = useState(() => LOCALIZED_DIET_TIPS['en'].gain);
  const [lossTips, setLossTips] = useState(() => LOCALIZED_DIET_TIPS['en'].loss);

  // Load from localStorage on mount and ensure up-to-date image URLs
  useEffect(() => {
    const mergeImages = (saved, defaults) => {
      if (!saved) return defaults;
      try {
        const parsed = JSON.parse(saved);
        return defaults.map(def => {
          const custom = parsed.find(item => item.id === def.id || item.name === def.name);
          if (!custom) return def;
          // If custom item has broken or default placeholder URL, replace with updated def.img
          const isBroken = !custom.img || 
            custom.img.includes('1586201375761-83865001e31c') || 
            custom.img.includes('1612198188060-c7c2a3b66eae') || 
            custom.img.includes('1601055903521-9c8d929a99cf') || 
            custom.img.includes('1609501676469-5d5af08e1b72');
          return {
            ...custom,
            img: isBroken ? def.img : custom.img
          };
        });
      } catch {
        return defaults;
      }
    };

    setGymFoods(mergeImages(localStorage.getItem('mv_gym_foods'), GYM_FOODS));
    setGainFoods(mergeImages(localStorage.getItem('mv_gain_foods'), WEIGHT_GAIN_FOODS));
    setLossFoods(mergeImages(localStorage.getItem('mv_loss_foods'), WEIGHT_LOSS_FOODS));
  }, []);

  // Update dynamic plans and tips based on active language
  useEffect(() => {
    const savedGymPlan = localStorage.getItem(`mv_gym_plan_${lang}`);
    setGymPlan(savedGymPlan ? JSON.parse(savedGymPlan) : (LOCALIZED_DIET_PLANS[lang]?.gym || LOCALIZED_DIET_PLANS['en']?.gym));

    const savedGainPlan = localStorage.getItem(`mv_gain_plan_${lang}`);
    setGainPlan(savedGainPlan ? JSON.parse(savedGainPlan) : (LOCALIZED_DIET_PLANS[lang]?.gain || LOCALIZED_DIET_PLANS['en']?.gain));

    const savedLossPlan = localStorage.getItem(`mv_loss_plan_${lang}`);
    setLossPlan(savedLossPlan ? JSON.parse(savedLossPlan) : (LOCALIZED_DIET_PLANS[lang]?.loss || LOCALIZED_DIET_PLANS['en']?.loss));

    const savedGymTips = localStorage.getItem(`mv_gym_tips_${lang}`);
    setGymTips(savedGymTips ? JSON.parse(savedGymTips) : (LOCALIZED_DIET_TIPS[lang]?.gym || LOCALIZED_DIET_TIPS['en']?.gym));

    const savedGainTips = localStorage.getItem(`mv_gain_tips_${lang}`);
    setGainTips(savedGainTips ? JSON.parse(savedGainTips) : (LOCALIZED_DIET_TIPS[lang]?.gain || LOCALIZED_DIET_TIPS['en']?.gain));

    const savedLossTips = localStorage.getItem(`mv_loss_tips_${lang}`);
    setLossTips(savedLossTips ? JSON.parse(savedLossTips) : (LOCALIZED_DIET_TIPS[lang]?.loss || LOCALIZED_DIET_TIPS['en']?.loss));
  }, [lang]);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('mv_gym_foods', JSON.stringify(gymFoods)); }, [gymFoods]);
  useEffect(() => { localStorage.setItem('mv_gain_foods', JSON.stringify(gainFoods)); }, [gainFoods]);
  useEffect(() => { localStorage.setItem('mv_loss_foods', JSON.stringify(lossFoods)); }, [lossFoods]);

  // Sync edited plan/tips per language
  useEffect(() => { localStorage.setItem(`mv_gym_plan_${lang}`, JSON.stringify(gymPlan)); }, [gymPlan, lang]);
  useEffect(() => { localStorage.setItem(`mv_gain_plan_${lang}`, JSON.stringify(gainPlan)); }, [gainPlan, lang]);
  useEffect(() => { localStorage.setItem(`mv_loss_plan_${lang}`, JSON.stringify(lossPlan)); }, [lossPlan, lang]);
  useEffect(() => { localStorage.setItem(`mv_gym_tips_${lang}`, JSON.stringify(gymTips)); }, [gymTips, lang]);
  useEffect(() => { localStorage.setItem(`mv_gain_tips_${lang}`, JSON.stringify(gainTips)); }, [gainTips, lang]);
  useEffect(() => { localStorage.setItem(`mv_loss_tips_${lang}`, JSON.stringify(lossTips)); }, [lossTips, lang]);

  // Sync state when user changes
  useEffect(() => {
    if (user?.id) {
      setSavedItems(JSON.parse(localStorage.getItem(`mv_saved_items_${user.id}`) || '[]'));
      setSavedCalories(parseInt(localStorage.getItem(`mv_saved_calories_${user.id}`) || '0', 10));
      setSavedProtein(parseInt(localStorage.getItem(`mv_saved_protein_${user.id}`) || '0', 10));
    }
  }, [user]);

  useEffect(() => { localStorage.setItem(user?.id ? `mv_saved_items_${user.id}` : 'mv_saved_items', JSON.stringify(savedItems)); }, [savedItems, user]);
  useEffect(() => { localStorage.setItem(user?.id ? `mv_saved_calories_${user.id}` : 'mv_saved_calories', savedCalories.toString()); }, [savedCalories, user]);
  useEffect(() => { localStorage.setItem(user?.id ? `mv_saved_protein_${user.id}` : 'mv_saved_protein', savedProtein.toString()); }, [savedProtein, user]);

  const sections = [
    { id: 'gym', label: dt('gymDiet'), color: '#f43f5e' }, // Rose/Crimson
    { id: 'gain', label: dt('weightGain'), color: '#8b5cf6' }, // Premium Purple
    { id: 'loss', label: dt('weightLoss'), color: '#14b8a6' }, // Premium Teal
    { id: 'vitamins', label: dt('vitaminsTable'), color: '#3b82f6' }, // Ocean Blue
  ];

  const currentFoods = activeSection === 'gym' ? gymFoods : activeSection === 'gain' ? gainFoods : lossFoods;
  const currentPlan = activeSection === 'gym' ? gymPlan : activeSection === 'gain' ? gainPlan : lossPlan;
  const currentTips = activeSection === 'gym' ? gymTips : activeSection === 'gain' ? gainTips : lossTips;

  // Food handlers
  const saveFood = (foodData) => {
    const setter = activeSection === 'gym' ? setGymFoods : activeSection === 'gain' ? setGainFoods : setLossFoods;
    if (editFoodModal.mode === 'edit') {
      setter(prev => prev.map(f => f.id === foodData.id ? foodData : f));
      showToast(`Updated ${foodData.name}`);
    } else {
      setter(prev => [...prev, { ...foodData, id: Date.now().toString() }]);
      showToast(`Added ${foodData.name}`);
    }
    setEditFoodModal(null);
  };

  const deleteFood = (id) => {
    if (!window.confirm("Are you sure you want to delete this food item?")) return;
    const setter = activeSection === 'gym' ? setGymFoods : activeSection === 'gain' ? setGainFoods : setLossFoods;
    setter(prev => prev.filter(f => f.id !== id));
    showToast("Food item removed");
  };

  const saveDietPlan = (newPlan) => {
    const setter = activeSection === 'gym' ? setGymPlan : activeSection === 'gain' ? setGainPlan : setLossPlan;
    setter(newPlan);
    setEditPlanModal(false);
    showToast("Diet plan updated successfully!");
  };

  const saveTips = (newTips) => {
    const setter = activeSection === 'gym' ? setGymTips : activeSection === 'gain' ? setGainTips : setLossTips;
    setter(newTips);
    setEditTipsModal(false);
    showToast("Nutrition tips updated successfully!");
  };

  const filteredFoods = useMemo(() => {
    let foods = currentFoods;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      foods = foods.filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || f.benefit.toLowerCase().includes(q));
    }
    if (activeFilters.length > 0) {
      foods = foods.filter(f => activeFilters.every(filter => f.tags.includes(filter)));
    }
    return foods;
  }, [currentFoods, searchQuery, activeFilters]);

  const toggleFilter = (filter) => {
    setActiveFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
  };

  const addToMyDiet = (food) => {
    if (savedItems.find(i => i.id === food.id)) {
      showToast(`${ft(food.name)} ${dt('toastAlreadyInDiet')}`, 'warn');
      return;
    }
    setSavedItems(prev => [...prev, food]);
    setSavedCalories(prev => prev + food.calories);
    setSavedProtein(prev => prev + food.protein);
    showToast(`✅ ${ft(food.name)} ${dt('toastAddedSuccess')}`, 'success');
  };

  const removeFromDiet = (food) => {
    setSavedItems(prev => prev.filter(i => i.id !== food.id));
    setSavedCalories(prev => Math.max(0, prev - food.calories));
    setSavedProtein(prev => Math.max(0, prev - food.protein));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPersonalizedProtein = () => {
    if (!userWeight) return null;
    const w = parseFloat(userWeight);
    if (isNaN(w)) return null;
    if (userGoal === 'gym') return `${(w * 1.8).toFixed(0)}g – ${(w * 2.2).toFixed(0)}g`;
    if (userGoal === 'gain') return `${(w * 1.6).toFixed(0)}g – ${(w * 2.0).toFixed(0)}g`;
    return `${(w * 1.4).toFixed(0)}g – ${(w * 1.8).toFixed(0)}g`;
  };

  const getPersonalizedCalories = () => {
    if (!userWeight) return null;
    const w = parseFloat(userWeight);
    if (isNaN(w)) return null;
    const bmr = w * 24;
    const tdee = bmr * 1.55;
    if (userGoal === 'gain') return `${(tdee + 400).toFixed(0)} kcal`;
    if (userGoal === 'loss') return `${(tdee - 400).toFixed(0)} kcal`;
    return `${tdee.toFixed(0)} kcal`;
  };

  const sectionColor = sections.find(s => s.id === activeSection)?.color || '#ff6b35';
  const caloriePercent = Math.min(100, (savedCalories / targetCalories) * 100);
  const proteinPercent = Math.min(100, (savedProtein / targetProtein) * 100);

  return (
    <div className="dp-root">
      {/* Toast */}
      {toast && (
        <div className={`dp-toast dp-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="dp-header">
        <div className="dp-header-content">
          <h1 className="dp-title">
            <span className="dp-title-icon">🥗</span>
            {dt('title')} <span className="dp-title-accent">{dt('accent')}</span>
          </h1>
          <p className="dp-subtitle">{dt('subtitle')}</p>
        </div>
        {/* Tracker Bar */}
        <div className="dp-tracker">
          <div className="dp-tracker-item">
            <span className="dp-tracker-label">🔥 {dt('dailyCalories')}</span>
            <div className="dp-progress-bar">
              <div className="dp-progress-fill dp-cal-fill" style={{ width: `${caloriePercent}%` }} />
            </div>
            <span className="dp-tracker-val">{savedCalories} / {targetCalories} kcal</span>
          </div>
          <div className="dp-tracker-item">
            <span className="dp-tracker-label">💪 {dt('dailyProtein')}</span>
            <div className="dp-progress-bar">
              <div className="dp-progress-fill dp-pro-fill" style={{ width: `${proteinPercent}%` }} />
            </div>
            <span className="dp-tracker-val">{savedProtein.toFixed(0)} / {targetProtein}g</span>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="dp-section-tabs">
        {sections.map(s => (
          <button
            key={s.id}
            className={`dp-section-tab ${activeSection === s.id ? 'active' : ''}`}
            style={activeSection === s.id ? { '--tab-color': s.color } : {}}
            onClick={() => { setActiveSection(s.id); setActiveSubTab('foods'); setSearchQuery(''); setActiveFilters([]); }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="dp-body">
        {activeSection === 'vitamins' ? (
          <VitaminsTable sectionColor={sectionColor} />
        ) : (
          <>
            {/* Sub-tab navigation */}
            <div className="dp-subtabs">
              {[
                { id: 'foods', label: dt('tabFoods') },
                { id: 'allinfo', label: dt('tabAllInfo') },
                { id: 'plan', label: dt('tabPlan') },
                { id: 'tips', label: dt('tabTips') },
                { id: 'saved', label: `${dt('tabSaved')} (${savedItems.length})` },
                { id: 'personal', label: dt('tabPersonal') },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`dp-subtab ${activeSubTab === tab.id ? 'active' : ''}`}
                  style={activeSubTab === tab.id ? { '--tab-color': sectionColor } : {}}
                  onClick={() => setActiveSubTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

        {/* ─── ALL FOOD INFO TABLE SUB-TAB ─── */}
        {activeSubTab === 'allinfo' && (
          <AllFoodInfoTable onAdd={addToMyDiet} />
        )}

        {/* ─── FOOD LIST SUB-TAB ─── */}
        {activeSubTab === 'foods' && (
          <div className="dp-foods-section">
            {/* Search & Filters */}
            <div className="dp-search-row">
              <button 
                className="dp-add-food-btn" 
                onClick={() => setEditFoodModal({ mode: 'add' })}
                style={{ background: sectionColor }}
              >
                <Plus size={18} /> {dt('addFood')}
              </button>
              <div className="dp-search-wrap">
                <span className="dp-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder={dt('searchFoodPlaceholder')}
                  className="dp-search-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && <button className="dp-search-clear" onClick={() => setSearchQuery('')}>✕</button>}
              </div>
              <div className="dp-filter-pills">
                {ALL_FILTERS.map(f => (
                  <button
                    key={f}
                    className={`dp-filter-pill ${activeFilters.includes(f) ? 'active' : ''}`}
                    style={activeFilters.includes(f) ? { '--tab-color': sectionColor } : {}}
                    onClick={() => toggleFilter(f)}
                  >
                    {ft(f)}
                  </button>
                ))}
                {activeFilters.length > 0 && (
                  <button className="dp-filter-pill dp-filter-clear" onClick={() => setActiveFilters([])}>{dt('cancelBtn')} ✕</button>
                )}
              </div>
            </div>

            {/* Result Count */}
            <p className="dp-result-count">{filteredFoods.length} {dt('resultCount')}</p>

            {/* Food Cards */}
            <div className="dp-food-grid">
              {filteredFoods.map(food => (
                <FoodCard 
                  key={food.id} 
                  food={food} 
                  onAdd={addToMyDiet} 
                  onEdit={() => setEditFoodModal({ mode: 'edit', food })}
                  onDelete={() => deleteFood(food.id)}
                  sectionColor={sectionColor} 
                />
              ))}
              {filteredFoods.length === 0 && (
                <div className="dp-empty">{dt('noFoodsMatch')}</div>
              )}
            </div>
          </div>
        )}

        {/* ─── DIET PLAN SUB-TAB ─── */}
        {activeSubTab === 'plan' && (
          <div className="dp-plan-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="dp-section-heading" style={{ color: sectionColor, margin: 0 }}>
                {dt('sampleDailyDietPlan')}
              </h2>
              <button 
                className="dp-edit-plan-btn" 
                onClick={() => setEditPlanModal(true)}
                style={{ background: `${sectionColor}15`, color: sectionColor, border: `1px solid ${sectionColor}40`, padding: '0.6rem 1.2rem', borderRadius: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
              >
                <Edit2 size={16} /> {dt('editPlan')}
              </button>
            </div>
            <div className="dp-plan-timeline">
              {Object.entries(gymPlan).map(([meal, desc], i) => {
                // Determine description based on active plan state
                let descText = desc;
                if (activeSection === 'gain') descText = gainPlan[meal] || desc;
                if (activeSection === 'loss') descText = lossPlan[meal] || desc;
                return (
                  <div key={meal} className="dp-plan-card">
                    <div className="dp-plan-dot" style={{ background: sectionColor }} />
                    <div className="dp-plan-content">
                      <span className="dp-plan-meal" style={{ color: sectionColor }}>{ft(meal)}</span>
                      <p className="dp-plan-desc">{descText}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TIPS SUB-TAB ─── */}
        {activeSubTab === 'tips' && (
          <div className="dp-tips-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="dp-section-heading" style={{ color: sectionColor, margin: 0 }}>
                {dt('expertNutritionTips')}
              </h2>
              <button 
                className="dp-edit-plan-btn" 
                onClick={() => setEditTipsModal(true)}
                style={{ background: `${sectionColor}15`, color: sectionColor, border: `1px solid ${sectionColor}40`, padding: '0.6rem 1.2rem', borderRadius: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
              >
                <Edit2 size={16} /> {dt('editTips')}
              </button>
            </div>
            <div className="dp-tips-grid">
              {currentTips.map((t, i) => (
                <div key={i} className="dp-tip-card">
                  <span className="dp-tip-icon">{t.icon}</span>
                  <p className="dp-tip-text">{t.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── SAVED DIET SUB-TAB ─── */}
        {activeSubTab === 'saved' && (
          <div className="dp-saved-section">
            <h2 className="dp-section-heading" style={{ color: sectionColor }}>
              {dt('mySavedDietPlan')}
            </h2>
            {savedItems.length === 0 ? (
              <div className="dp-empty-saved">
                <span style={{ fontSize: '3rem' }}>🥗</span>
                <p>{dt('noFoodsAddedYet')}</p>
              </div>
            ) : (
              <>
                <div className="dp-saved-tracker">
                  <div className="dp-saved-stat" style={{ borderColor: '#ff6b35' }}>
                    <span className="dp-saved-stat-val" style={{ color: '#ff6b35' }}>{savedCalories}</span>
                    <span className="dp-saved-stat-label">{dt('totalCalories')}</span>
                  </div>
                  <div className="dp-saved-stat" style={{ borderColor: '#20bf6b' }}>
                    <span className="dp-saved-stat-val" style={{ color: '#20bf6b' }}>{savedProtein.toFixed(0)}g</span>
                    <span className="dp-saved-stat-label">{dt('totalProtein')}</span>
                  </div>
                  <div className="dp-saved-stat" style={{ borderColor: '#a55eea' }}>
                    <span className="dp-saved-stat-val" style={{ color: '#a55eea' }}>{savedItems.length}</span>
                    <span className="dp-saved-stat-label">{dt('foodItemsCount')}</span>
                  </div>
                </div>
                <div className="dp-saved-list">
                  {savedItems.map(food => (
                    <div key={food.id} className="dp-saved-row">
                      <img src={food.img} alt={ft(food.name)} className="dp-saved-img" />
                      <div className="dp-saved-info">
                        <span className="dp-saved-name">{ft(food.name)}</span>
                        <span className="dp-saved-meta">{food.protein}g {dt('proteinLabelOnly').toLowerCase()} · {food.calories} kcal · {food.fat}g {dt('fatLabelOnly').toLowerCase()}</span>
                      </div>
                      <button className="dp-remove-btn" onClick={() => removeFromDiet(food)}>{dt('removeBtn')}</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── PERSONALIZED SUB-TAB ─── */}
        {activeSubTab === 'personal' && (
          <div className="dp-personal-section">
            <h2 className="dp-section-heading" style={{ color: sectionColor }}>
              {dt('personalDietCalculator')}
            </h2>
            <div className="dp-personal-form">
              <div className="dp-form-group">
                <label className="dp-form-label">{dt('bodyWeightLabel')}</label>
                <input
                  type="number"
                  className="dp-form-input"
                  placeholder={dt('bodyWeightPlaceholder')}
                  value={userWeight}
                  onChange={e => setUserWeight(e.target.value)}
                />
              </div>
              <div className="dp-form-group">
                <label className="dp-form-label">{dt('goalLabel')}</label>
                <div className="dp-radio-group">
                  {[{ v: 'gym', l: dt('goalGym') }, { v: 'gain', l: dt('goalGain') }, { v: 'loss', l: dt('goalLoss') }].map(opt => (
                    <label key={opt.v} className={`dp-radio-opt ${userGoal === opt.v ? 'active' : ''}`} style={userGoal === opt.v ? { '--tab-color': sectionColor } : {}}>
                      <input type="radio" name="goal" value={opt.v} checked={userGoal === opt.v} onChange={() => setUserGoal(opt.v)} hidden />
                      {opt.l}
                    </label>
                  ))}
                </div>
              </div>
              <div className="dp-form-group">
                <label className="dp-form-label">{dt('dietPreferenceLabel')}</label>
                <div className="dp-radio-group">
                  {[{ v: 'veg', l: dt('preferenceVeg') }, { v: 'nonveg', l: dt('preferenceNonVeg') }, { v: 'both', l: dt('preferenceBoth') }].map(opt => (
                    <label key={opt.v} className={`dp-radio-opt ${dietType === opt.v ? 'active' : ''}`} style={dietType === opt.v ? { '--tab-color': sectionColor } : {}}>
                      <input type="radio" name="diettype" value={opt.v} checked={dietType === opt.v} onChange={() => setDietType(opt.v)} hidden />
                      {opt.l}
                    </label>
                  ))}
                </div>
              </div>
              <button className="dp-generate-btn" style={{ background: sectionColor }} onClick={() => { if (userWeight) setShowPersonalized(true); else showToast(dt('toastPleaseWeight'), 'warn'); }}>
                {dt('generatePlanBtn')}
              </button>
            </div>
            {showPersonalized && userWeight && (
              <div className="dp-personal-result" style={{ borderColor: sectionColor }}>
                <h3 className="dp-result-title" style={{ color: sectionColor }}>{dt('personalizedTargetsTitle')}</h3>
                <div className="dp-result-grid">
                  <div className="dp-result-card">
                    <span className="dp-result-icon">⚖️</span>
                    <span className="dp-result-val">{userWeight} kg</span>
                    <span className="dp-result-lbl">{dt('personalizedBodyWeight')}</span>
                  </div>
                  <div className="dp-result-card">
                    <span className="dp-result-icon">🔥</span>
                    <span className="dp-result-val">{getPersonalizedCalories()}</span>
                    <span className="dp-result-lbl">{dt('personalizedDailyCalories')}</span>
                  </div>
                  <div className="dp-result-card">
                    <span className="dp-result-icon">💪</span>
                    <span className="dp-result-val">{getPersonalizedProtein()}</span>
                    <span className="dp-result-lbl">{dt('personalizedDailyProtein')}</span>
                  </div>
                  <div className="dp-result-card">
                    <span className="dp-result-icon">{dietType === 'veg' ? '🥦' : dietType === 'nonveg' ? '🍗' : '🥗'}</span>
                    <span className="dp-result-val">{dietType === 'veg' ? dt('vegText') : dietType === 'nonveg' ? dt('nonvegText') : dt('bothText')}</span>
                    <span className="dp-result-lbl">{dt('personalizedDietType')}</span>
                  </div>
                </div>
                <div className="dp-result-advice">
                  <h4>{dt('keyRecommendationsTitle')}</h4>
                  <ul>
                    {userGoal === 'gym' && <>
                      <li>{dt('gymRecommendation1')}</li>
                      <li>{dt('gymRecommendation2')}</li>
                      <li>{dt('gymRecommendation3')}</li>
                    </>}
                    {userGoal === 'gain' && <>
                      <li>{dt('gainRecommendation1')}</li>
                      <li>{dt('gainRecommendation2')}</li>
                      <li>{dt('gainRecommendation3')}</li>
                    </>}
                    {userGoal === 'loss' && <>
                      <li>{dt('lossRecommendation1')}</li>
                      <li>{dt('lossRecommendation2')}</li>
                      <li>{dt('lossRecommendation3')}</li>
                    </>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
        </>)}
      </div>

      {/* --- MODALS --- */}
      {editPlanModal && (
        <EditPlanModal 
          plan={currentPlan} 
          onSave={saveDietPlan} 
          onClose={() => setEditPlanModal(false)} 
          sectionColor={sectionColor} 
        />
      )}

      {editTipsModal && (
        <EditTipsModal 
          tips={currentTips} 
          onSave={saveTips} 
          onClose={() => setEditTipsModal(false)} 
          sectionColor={sectionColor} 
        />
      )}

      {editFoodModal && (
        <EditFoodModal 
          mode={editFoodModal.mode} 
          food={editFoodModal.food} 
          onSave={saveFood} 
          onClose={() => setEditFoodModal(null)} 
          sectionColor={sectionColor} 
        />
      )}

      {/* AI Diet ChatBot */}
      <ChatBot
        botName="DietBot"
        accentColor="#10b981"
        welcomeMessage={dt('botWelcome')}
        systemPrompt={dt('botSystemPrompt')}
        quickPrompts={[
          dt('botPrompt1'),
          dt('botPrompt2'),
          dt('botPrompt3'),
          dt('botPrompt4')
        ]}
      />

      <SectionAbout
        title={dt('title') + ' ' + dt('accent')}
        icon="🥗"
        color="#10b981"
        gradient="linear-gradient(135deg, #10b981, #f59e0b)"
        what={dt('aboutWhat')}
        howToUse={dt('aboutHow')}
        importance={dt('aboutWhy')}
      />
    </div>
  );
}

function FoodCard({ food, onAdd, onEdit, onDelete, sectionColor }) {
  const { lang } = useLanguage();
  const dt = (key) => DIET_T[lang]?.[key] || DIET_T['en']?.[key] || key;
  const ft = (text) => FOOD_T[lang]?.[text] || FOOD_T['en']?.[text] || text;
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="dp-food-card">
      <div className="dp-food-img-wrap">
        <img
          src={imgErr ? `https://placehold.co/300x200/1a1a2e/ffffff?text=${encodeURIComponent(ft(food.name))}` : food.img}
          alt={ft(food.name)}
          className="dp-food-img"
          onError={() => setImgErr(true)}
        />
        <div className="dp-food-actions">
           <button className="dp-icon-btn dp-edit-btn" onClick={onEdit} title={dt('editFoodTitle')}><Edit2 size={14} /></button>
           <button className="dp-icon-btn dp-delete-btn" onClick={onDelete} title={dt('toastRemoved')}><Trash2 size={14} /></button>
        </div>
        {food.star && <span className="dp-star-badge" title={dt('recommendedLabel')}>⭐</span>}
        <span className="dp-cat-badge">{ft(food.category)}</span>
      </div>
      <div className="dp-food-body">
        <h3 className="dp-food-name">{ft(food.name)}</h3>
        <p className="dp-food-benefit" style={{ color: sectionColor }}>{ft(food.benefit)}</p>
        <div className="dp-food-stats">
          <StatBadge label={dt('proteinLabelOnly')} value={`${food.protein}g`} color="#4ecdc4" />
          <StatBadge label={dt('caloriesLabelOnly')} value={food.calories} color="#ff6b35" />
          <StatBadge label={dt('fatLabelOnly')} value={`${food.fat}g`} color="#f7b731" />
          {food.fiber > 0 && <StatBadge label={dt('fiberLabelOnly')} value={`${food.fiber}g`} color="#20bf6b" />}
        </div>
        <p className="dp-food-nutrients"><span className="dp-nu-label">{dt('keyNutrientsLabelOnly')}</span> {ft(food.keyNutrients)}</p>
        <div className="dp-food-tags">
          {food.tags.map(t => <span key={t} className="dp-tag">{ft(t)}</span>)}
        </div>
        <button
          className="dp-add-btn"
          style={{ '--btn-color': sectionColor }}
          onClick={() => onAdd(food)}
        >
          + {dt('addFood')}
        </button>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className="dp-stat-badge" style={{ '--badge-color': color }}>
      <span className="dp-stat-val">{value}</span>
      <span className="dp-stat-lbl">{label}</span>
    </div>
  );
}

// ── ALL FOOD INFO TABLE ──────────────────────────────────────────────────────────

const ALL_SECTIONS_TABLE = [
  {
    id: 'gym',
    label: '🏋️ Gymers – High Protein & Fitness Foods',
    accent: '#ff6b35',
    headerBg: 'linear-gradient(135deg, #ff6b35 0%, #e05c19 100%)',
    rowColors: ['rgba(255,107,53,0.05)', 'rgba(255,107,53,0.02)'],
    borderColor: '#ff6b35',
    subGroups: [
      {
        title: 'Animal-Based (Complete Proteins)',
        icon: '🍗',
        color: '#e05c19',
        rows: [
          { star: true,  name: 'Chicken Breast',    protein: 31,    fiber: 0,  fat: 3.6, calories: 165,     keyNutrients: 'B6, Niacin',         uses: 'Muscle, weight control' },
          { star: true,  name: 'Eggs',              protein: 13,    fiber: 0,  fat: 11,  calories: 155,     keyNutrients: 'B12, Choline',       uses: 'Muscle, brain' },
          { star: true,  name: 'Salmon',            protein: 22,    fiber: 0,  fat: 13,  calories: 208,     keyNutrients: 'Omega-3, D',         uses: 'Heart, brain' },
          { star: true,  name: 'Tuna',              protein: 25,    fiber: 0,  fat: 1,   calories: 132,     keyNutrients: 'B12, Niacin',        uses: 'Fat loss' },
          { star: false, name: 'Turkey Breast',     protein: 29,    fiber: 0,  fat: 1,   calories: 135,     keyNutrients: 'B6',                 uses: 'Lean protein' },
          { star: false, name: 'Shrimp',            protein: 24,    fiber: 0,  fat: 1,   calories: 100,     keyNutrients: 'Selenium, Iodine',   uses: 'Low calorie' },
          { star: false, name: 'Pork Tenderloin',   protein: 27,    fiber: 0,  fat: 3,   calories: 143,     keyNutrients: 'B1',                 uses: 'Lean meat' },
          { star: false, name: 'Bison',             protein: 26,    fiber: 0,  fat: 2.5, calories: 143,     keyNutrients: 'Iron',               uses: 'Red meat alt' },
          { star: false, name: 'Lean Jerky',        protein: 30,    fiber: 0,  fat: 3,   calories: 300,     keyNutrients: 'Iron',               uses: 'Snack' },
          { star: false, name: 'Scallops',          protein: 20,    fiber: 0,  fat: 1,   calories: 110,     keyNutrients: 'Magnesium',          uses: 'Seafood' },
        ],
      },
      {
        title: 'Dairy & Soy-Based',
        icon: '🥛',
        color: '#4ecdc4',
        rows: [
          { star: true,  name: 'Greek Yogurt',       protein: 10,   fiber: 0,  fat: 0.4, calories: 59,      keyNutrients: 'Calcium, Probiotics', uses: 'Gut health' },
          { star: false, name: 'Cottage Cheese',      protein: 11,   fiber: 0,  fat: 4,   calories: 98,      keyNutrients: 'Calcium',             uses: 'Slow protein' },
          { star: true,  name: 'Tofu',                protein: 8,    fiber: 1,  fat: 4,   calories: 76,      keyNutrients: 'Calcium',             uses: 'Veg protein' },
          { star: false, name: 'Soybeans (Edamame)',  protein: 11,   fiber: 5,  fat: 5,   calories: 121,     keyNutrients: 'Iron, Fiber',         uses: 'Snack' },
          { star: false, name: 'Cheese',              protein: 30,   fiber: 0,  fat: 25,  calories: 402,     keyNutrients: 'Calcium, B12',        uses: 'Energy' },
          { star: true,  name: 'Paneer',              protein: 19,   fiber: 0,  fat: 20,  calories: 265,     keyNutrients: 'Calcium',             uses: 'Weight + muscle' },
          { star: true,  name: 'Milk',                protein: 3.5,  fiber: 0,  fat: 4,   calories: 65,      keyNutrients: 'Calcium, Vitamin D',  uses: 'Balanced nutrition' },
        ],
      },
      {
        title: 'Plant-Based & Healthy Fats',
        icon: '🌿',
        color: '#20bf6b',
        rows: [
          { star: true,  name: 'Quinoa',         protein: 4.4,  fiber: 2.8, fat: 1.9, calories: 120,   keyNutrients: 'Magnesium',   uses: 'Energy' },
          { star: false, name: 'Lentils / Beans', protein: 9,    fiber: 8,   fat: 0.4, calories: 116,   keyNutrients: 'Iron, Folate',uses: 'Digestion' },
          { star: true,  name: 'Chickpeas',       protein: 19,   fiber: 17,  fat: 6,   calories: 364,   keyNutrients: 'Fiber, B9',   uses: 'Energy' },
          { star: true,  name: 'Almonds',         protein: 21,   fiber: 12,  fat: 49,  calories: 579,   keyNutrients: 'Vitamin E',   uses: 'Healthy fats' },
          { star: false, name: 'Walnuts',          protein: 15,   fiber: 7,   fat: 65,  calories: 654,   keyNutrients: 'Omega-3',     uses: 'Brain' },
          { star: false, name: 'Sunflower Seeds',  protein: 21,   fiber: 9,   fat: 51,  calories: 584,   keyNutrients: 'Vitamin E',   uses: 'Antioxidant' },
        ],
      },
      {
        title: 'Grains & Protein Supplements',
        icon: '🌾',
        color: '#a55eea',
        rows: [
          { star: false, name: 'Buckwheat',      protein: 13,   fiber: 10, fat: 3.4, calories: 343,    keyNutrients: 'Fiber',      uses: 'Energy' },
          { star: false, name: 'Brown Rice',     protein: 2.6,  fiber: 1.8,fat: 1,   calories: 123,    keyNutrients: 'B vitamins', uses: 'Carbs' },
          { star: false, name: 'Oats',           protein: 14,   fiber: 10, fat: 7,   calories: 380,    keyNutrients: 'Beta-glucan',uses: 'Heart health' },
          { star: true,  name: 'Protein Powder', protein: '70–80', fiber: 0, fat: '1–5', calories: '350–400', keyNutrients: 'BCAAs', uses: 'Recovery' },
        ],
      },
    ],
  },
  {
    id: 'loss',
    label: '⬇️ Weight Loss – Low Calorie & High Fiber Foods',
    accent: '#20bf6b',
    headerBg: 'linear-gradient(135deg, #20bf6b 0%, #0fb9b1 100%)',
    rowColors: ['rgba(32,191,107,0.06)', 'rgba(32,191,107,0.02)'],
    borderColor: '#20bf6b',
    subGroups: [
      {
        title: 'Whole Grains (High Fiber & Complex Carbs)',
        icon: '🌾',
        color: '#0fb9b1',
        rows: [
          { star: true,  name: 'Oats',               protein: '13–16', fiber: 10,    fat: 7,   calories: '~380', keyNutrients: 'Beta-glucan, heart health',       uses: 'Heart health' },
          { star: false, name: 'Dalia (Broken Wheat)',protein: 12,      fiber: '10–12',fat: 2,  calories: '~340', keyNutrients: 'Digestion, light food',           uses: 'Easy digestion' },
          { star: true,  name: 'Quinoa',              protein: '14–16', fiber: 7,     fat: 6,   calories: '~370', keyNutrients: 'Complete protein, magnesium',     uses: 'Complete protein' },
          { star: false, name: 'Ragi (Finger Millet)',protein: '7–8',   fiber: 11,    fat: 1.5, calories: '~330', keyNutrients: 'Calcium, iron, digestion',        uses: 'Calcium & digestion' },
          { star: false, name: 'Bajra (Pearl Millet)',protein: '11–12', fiber: 1.3,   fat: 5,   calories: '~360', keyNutrients: 'Iron, satiety',                  uses: 'Iron & satiety' },
          { star: false, name: 'Jowar (Sorghum)',     protein: '10–11', fiber: 9.7,   fat: 3,   calories: '~330', keyNutrients: 'Gluten-free, weight loss',        uses: 'Gluten-free grain' },
          { star: true,  name: 'Brown Rice',          protein: '7–8',   fiber: '3–4', fat: 2,   calories: '~360', keyNutrients: 'Energy, complex carbs',           uses: 'Complex carbs' },
        ],
      },
      {
        title: 'High Quality & Metabolism Boosting Proteins',
        icon: '💪',
        color: '#20bf6b',
        rows: [
          { star: true,  name: 'Eggs (1 whole)',    protein: '6–7',   fiber: 0,   fat: 5,   calories: '~70–80', keyNutrients: 'Choline, high-quality protein', uses: 'High-quality protein' },
          { star: true,  name: 'Lentils (Dal)',     protein: '8–9',   fiber: 8,   fat: 0.5, calories: '~110',   keyNutrients: 'Iron, folate, fiber',          uses: 'Iron & fiber' },
          { star: true,  name: 'Sprouts',           protein: '3–4',   fiber: 4,   fat: 0.5, calories: '~30',    keyNutrients: 'Vitamin C, metabolism',        uses: 'Boosts metabolism' },
          { star: true,  name: 'Chickpeas (Chana)', protein: 19,      fiber: 16,  fat: 6,   calories: '~360',   keyNutrients: 'Fiber, fullness',              uses: 'Keeps you full' },
          { star: true,  name: 'Soya Chunks',       protein: 52,      fiber: 13,  fat: 0.5, calories: '~345',   keyNutrients: 'High protein, low fat',        uses: 'Very high protein' },
          { star: true,  name: 'Chicken Breast',    protein: 31,      fiber: 0,   fat: 3.6, calories: '~165',   keyNutrients: 'Lean muscle protein',          uses: 'Lean muscle' },
          { star: false, name: 'Fish (White)',       protein: '18–20', fiber: 0,   fat: '1–3',calories: '~100',  keyNutrients: 'Omega-3, low fat',             uses: 'Omega-3 & lean protein' },
          { star: false, name: 'Tofu / Paneer (Low-fat)', protein: '15–18', fiber: 0, fat: '4–6', calories: '~100–150', keyNutrients: 'Calcium, protein', uses: 'Calcium & protein' },
        ],
      },
      {
        title: 'High Fiber & Low Calorie Fruits & Vegetables',
        icon: '🥦',
        color: '#26de81',
        rows: [
          { star: true,  name: 'Spinach',              protein: 2.5, fiber: '2–3', fat: 0.4, calories: '<25',    keyNutrients: 'Iron, Vitamin K',              uses: 'Iron & low calorie' },
          { star: true,  name: 'Broccoli',             protein: 2.5, fiber: '2–3', fat: 0.4, calories: 34,       keyNutrients: 'Vitamin C, fiber',             uses: 'Vitamin C & fiber' },
          { star: true,  name: 'Apple',                protein: 0.3, fiber: '2–3', fat: 0.2, calories: '50–60',  keyNutrients: 'Fiber, blood sugar control',   uses: 'Blood sugar control' },
          { star: false, name: 'Papaya',               protein: 0.5, fiber: '1–2', fat: 0.3, calories: 40,       keyNutrients: 'Digestion',                    uses: 'Digestion & low calorie' },
          { star: false, name: 'Strawberries (Berries)',protein: 0.7, fiber: '2–3', fat: 0.3, calories: '30–40',  keyNutrients: 'Antioxidants',                 uses: 'Antioxidants' },
          { star: true,  name: 'Guava',                protein: 2.5, fiber: '5–6', fat: 0.9, calories: '60–70',  keyNutrients: 'Very high fiber, Vitamin C',   uses: 'Very high fiber' },
        ],
      },
    ],
  },
  {
    id: 'gain',
    label: '⬆️ Weight Gain – High Calorie & Nutrient Dense Foods',
    accent: '#f7b731',
    headerBg: 'linear-gradient(135deg, #f7b731 0%, #fd9644 100%)',
    rowColors: ['rgba(247,183,49,0.07)', 'rgba(247,183,49,0.02)'],
    borderColor: '#f7b731',
    subGroups: [
      {
        title: 'High-Calorie Fats (Fast Weight Gain)',
        icon: '🥑',
        color: '#fd9644',
        rows: [
          { star: true,  name: 'Ghee',           protein: 0,    fiber: 0,  fat: 100, calories: 900,    keyNutrients: 'A, E, K',   uses: 'Add calories easily' },
          { star: true,  name: 'Almonds',         protein: 21,   fiber: 12, fat: 49,  calories: 579,    keyNutrients: 'Vitamin E',  uses: 'Healthy fats' },
          { star: true,  name: 'Walnuts',         protein: 15,   fiber: 7,  fat: 65,  calories: 654,    keyNutrients: 'Omega-3',    uses: 'Brain' },
          { star: true,  name: 'Peanuts',         protein: 26,   fiber: 8,  fat: 49,  calories: 567,    keyNutrients: 'B3',         uses: 'Budget calories' },
          { star: false, name: 'Cashews',         protein: 18,   fiber: 3,  fat: 44,  calories: 553,    keyNutrients: 'K, B6',      uses: 'Snacks' },
          { star: false, name: 'Avocado',         protein: 2,    fiber: 7,  fat: 15,  calories: 160,    keyNutrients: 'E, K',       uses: 'Healthy fats' },
          { star: false, name: 'Dark Chocolate',  protein: '7–8',fiber: 7,  fat: 42,  calories: 598,    keyNutrients: 'Iron',       uses: 'High calorie' },
        ],
      },
      {
        title: 'High-Protein Foods (Muscle Gain)',
        icon: '🍗',
        color: '#e05c19',
        rows: [
          { star: true,  name: 'Chicken (Leg/Thigh)', protein: 19,    fiber: 0,  fat: 15, calories: 209,    keyNutrients: 'B vitamins',  uses: 'Muscle growth' },
          { star: true,  name: 'Eggs',                protein: 13,    fiber: 0,  fat: 11, calories: 155,    keyNutrients: 'B12, D',      uses: 'Recovery' },
          { star: true,  name: 'Paneer',              protein: '18–20',fiber: 0, fat: 20, calories: 265,    keyNutrients: 'Calcium',     uses: 'Weight + muscle' },
          { star: true,  name: 'Soybean',             protein: 36,    fiber: 9,  fat: 20, calories: 446,    keyNutrients: 'Folate',      uses: 'Veg protein' },
          { star: true,  name: 'Moong Dal',           protein: 24,    fiber: 8,  fat: 1,  calories: 347,    keyNutrients: 'B-complex',   uses: 'Easy protein' },
          { star: false, name: 'Rajma',               protein: 22,    fiber: 15, fat: 1,  calories: 333,    keyNutrients: 'Folate',      uses: 'Fiber + protein' },
          { star: false, name: 'Salmon',              protein: 20,    fiber: 0,  fat: 13, calories: 208,    keyNutrients: 'D, B12',      uses: 'Omega-3' },
          { star: false, name: 'Whole Milk',          protein: 3.5,   fiber: 0,  fat: 4,  calories: '60–70',keyNutrients: 'A, B',        uses: 'Balanced nutrition' },
          { star: false, name: 'Sattu',               protein: 20,    fiber: 7,  fat: 7,  calories: 387,    keyNutrients: 'B-complex',   uses: 'Energy protein' },
        ],
      },
      {
        title: 'Carbohydrate & Energy Foods',
        icon: '🍚',
        color: '#a55eea',
        rows: [
          { star: true,  name: 'White Rice',    protein: '6–7', fiber: 0,  fat: 0.5, calories: 345,    keyNutrients: 'B vitamins',  uses: 'Main energy' },
          { star: true,  name: 'Oats',          protein: 17,    fiber: 10, fat: 7,   calories: 389,    keyNutrients: 'B1',          uses: 'Sustained energy' },
          { star: true,  name: 'Banana',        protein: 1.1,   fiber: 2.6,fat: 0.3, calories: 89,     keyNutrients: 'B6, C',       uses: 'Post-workout' },
          { star: true,  name: 'Sweet Potato',  protein: 1.6,   fiber: 3,  fat: 0.1, calories: 86,     keyNutrients: 'Vitamin A',   uses: 'Slow energy' },
          { star: false, name: 'Potatoes',      protein: 2,     fiber: 2,  fat: 0.1, calories: 77,     keyNutrients: 'C, B6',       uses: 'Glycogen' },
          { star: false, name: 'Ragi',          protein: 7,     fiber: 3,  fat: 1.3, calories: 328,    keyNutrients: 'Calcium',     uses: 'Strength' },
          { star: false, name: 'Bajra',         protein: 11,    fiber: 9,  fat: 5,   calories: 361,    keyNutrients: 'Iron',        uses: 'Energy' },
        ],
      },
      {
        title: 'Natural Sugar & Quick Energy Foods',
        icon: '🍯',
        color: '#f7b731',
        rows: [
          { star: true,  name: 'Dates',    protein: 2.5, fiber: 7,  fat: 0.4, calories: 282, keyNutrients: 'B-complex', uses: 'Instant energy' },
          { star: true,  name: 'Raisins',  protein: 3,   fiber: 4,  fat: 0.5, calories: 299, keyNutrients: 'B6',        uses: 'Energy boost' },
        ],
      },
    ],
  },
];

function AllFoodInfoTable({ onAdd }) {
  const { lang } = useLanguage();
  const dt = (key) => DIET_T[lang]?.[key] || DIET_T['en']?.[key] || key;
  const ft = (text) => FOOD_T[lang]?.[text] || FOOD_T['en']?.[text] || text;

  const [activeSection, setActiveSection] = useState('gym');
  const [tableSearch, setTableSearch] = useState('');

  const currentSection = ALL_SECTIONS_TABLE.find(s => s.id === activeSection);

  const filteredGroups = useMemo(() => {
    if (!tableSearch.trim()) return currentSection.subGroups;
    const q = tableSearch.toLowerCase();
    return currentSection.subGroups
      .map(g => ({ ...g, rows: g.rows.filter(r => r.name.toLowerCase().includes(q) || r.uses.toLowerCase().includes(q) || String(r.keyNutrients).toLowerCase().includes(q)) }))
      .filter(g => g.rows.length > 0);
  }, [currentSection, tableSearch]);

  const totalRows = filteredGroups.reduce((acc, g) => acc + g.rows.length, 0);

  const getSectionLabel = (id) => {
    if (id === 'gym') return dt('gymersTable');
    if (id === 'loss') return dt('weightLossTable');
    return dt('weightGainTable');
  };

  return (
    <div className="fi-root">
      {/* Section Switcher */}
      <div className="fi-section-bar">
        {ALL_SECTIONS_TABLE.map(s => (
          <button
            key={s.id}
            className={`fi-section-btn ${activeSection === s.id ? 'fi-active' : ''}`}
            style={activeSection === s.id ? { background: s.accent, borderColor: s.accent, color: '#fff', boxShadow: `0 10px 30px rgba(0, 0, 0, 0.1)` } : { borderColor: s.borderColor, color: s.accent }}
            onClick={() => { setActiveSection(s.id); setTableSearch(''); }}
          >
            {getSectionLabel(s.id)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="fi-search-row">
        <div className="fi-search-wrap">
          <span className="fi-search-icon">🔍</span>
          <input
            type="text"
            className="fi-search-input"
            placeholder={dt('searchTablePlaceholder')}
            value={tableSearch}
            onChange={e => setTableSearch(e.target.value)}
            style={{ '--focus-color': currentSection.accent }}
          />
          {tableSearch && <button className="fi-search-clear" onClick={() => setTableSearch('')}>✕</button>}
        </div>
        <span className="fi-total-badge" style={{ background: currentSection.accent }}>
          {totalRows} {dt('foodItemsCount').toLowerCase()}
        </span>
      </div>

      {/* Sub-group Tables */}
      {filteredGroups.map((group, gi) => (
        <div key={gi} className="fi-group" style={{ '--group-color': group.color, '--group-border': currentSection.borderColor }}>
          <div className="fi-group-header" style={{ background: `linear-gradient(90deg, ${group.color}22 0%, transparent 100%)`, borderLeft: `4px solid ${group.color}` }}>
            <span className="fi-group-icon">{group.icon}</span>
            <span className="fi-group-title" style={{ color: group.color }}>{ft(group.title)}</span>
            <span className="fi-group-count" style={{ background: group.color }}>{group.rows.length} {dt('foodItemsCount').toLowerCase()}</span>
          </div>
          <div className="fi-table-wrap">
            <table className="fi-table">
              <thead>
                <tr className="fi-thead-row" style={{ '--th-color': group.color }}>
                  <th className="fi-th fi-th-food">{dt('starFoodHeader')}</th>
                  <th className="fi-th fi-th-num">{dt('proteinTableHeader')}</th>
                  <th className="fi-th fi-th-num">{dt('fiberTableHeader')}</th>
                  <th className="fi-th fi-th-num">{dt('fatTableHeader')}</th>
                  <th className="fi-th fi-th-num">{dt('caloriesTableHeader')}</th>
                  <th className="fi-th fi-th-nutrients">{dt('keyNutrientsTableHeader')}</th>
                  <th className="fi-th fi-th-uses">{dt('usesTableHeader')}</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={`fi-row ${ri % 2 === 0 ? 'fi-row-even' : 'fi-row-odd'}`}
                    style={{ '--row-accent': group.color }}
                  >
                    <td className="fi-td fi-td-food">
                      {row.star && <span className="fi-star">⭐</span>}
                      <span className="fi-food-name">{ft(row.name)}</span>
                    </td>
                    <td className="fi-td fi-td-num">
                      <span className="fi-badge fi-badge-protein">{row.protein}</span>
                    </td>
                    <td className="fi-td fi-td-num">
                      <span className="fi-badge fi-badge-fiber">{row.fiber}</span>
                    </td>
                    <td className="fi-td fi-td-num">
                      <span className="fi-badge fi-badge-fat">{row.fat}</span>
                    </td>
                    <td className="fi-td fi-td-num">
                      <span className="fi-badge fi-badge-cal">{row.calories}</span>
                    </td>
                    <td className="fi-td fi-td-nutrients">
                      <span className="fi-nutrients-text">{ft(row.keyNutrients)}</span>
                    </td>
                    <td className="fi-td fi-td-uses">
                      <span className="fi-uses-pill" style={{ background: `${group.color}18`, color: group.color, border: `1px solid ${group.color}40` }}>
                        {ft(row.uses)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {filteredGroups.length === 0 && (
        <div className="fi-empty">{dt('noTableResults')}</div>
      )}
    </div>
  );
}

// ── EDIT MODALS ──────────────────────────────────────────────────────────────────

function EditPlanModal({ plan, onSave, onClose, sectionColor }) {
  const { lang } = useLanguage();
  const dt = (key) => DIET_T[lang]?.[key] || DIET_T['en']?.[key] || key;
  const [formData, setFormData] = useState({ ...plan });

  return (
    <div className="dp-modal-overlay">
      <div className="dp-modal">
        <div className="dp-modal-header" style={{ borderColor: sectionColor }}>
          <h2 style={{ color: sectionColor }}><Edit2 size={20} /> {dt('editPlanTitle')}</h2>
          <button className="dp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="dp-modal-body">
          <p className="dp-modal-hint">{dt('editPlanHint')}</p>
          <div className="dp-modal-form">
            {Object.keys(plan).map(meal => (
              <div key={meal} className="dp-modal-group">
                <label className="dp-modal-label">{meal}</label>
                <textarea 
                  className="dp-modal-textarea"
                  value={formData[meal]}
                  onChange={e => setFormData({ ...formData, [meal]: e.target.value })}
                  placeholder={`Description for ${meal}...`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="dp-modal-footer">
          <button className="dp-btn-cancel" style={{ color: sectionColor }} onClick={onClose}>{dt('cancelBtn')}</button>
          <button className="dp-btn-save" style={{ background: sectionColor }} onClick={() => onSave(formData)}>
            <Save size={18} /> {dt('savePlanBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditFoodModal({ mode, food, onSave, onClose, sectionColor }) {
  const { lang } = useLanguage();
  const dt = (key) => DIET_T[lang]?.[key] || DIET_T['en']?.[key] || key;
  const [formData, setFormData] = useState(food || {
    name: '',
    protein: 0,
    calories: 0,
    fat: 0,
    fiber: 0,
    keyNutrients: '',
    benefit: '',
    category: 'Other',
    star: false,
    tags: [],
    img: ''
  });

  return (
    <div className="dp-modal-overlay">
      <div className="dp-modal dp-modal-lg">
        <div className="dp-modal-header" style={{ borderColor: sectionColor }}>
          <h2 style={{ color: sectionColor }}>
            {mode === 'edit' ? <Edit2 size={20} /> : <Plus size={20} />} 
            {mode === 'edit' ? dt('editFoodTitle') : dt('addFoodTitle')}
          </h2>
          <button className="dp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="dp-modal-body">
          <div className="dp-modal-form dp-grid-form">
            <div className="dp-modal-group">
              <label className="dp-modal-label">{dt('foodNameLabel')}</label>
              <input 
                className="dp-modal-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Brown Rice"
              />
            </div>
            <div className="dp-modal-group">
              <label className="dp-modal-label">{dt('categoryLabel')}</label>
              <input 
                className="dp-modal-input"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Grains"
              />
            </div>
            <div className="dp-modal-group">
              <label className="dp-modal-label">{dt('proteinLabel')}</label>
              <input type="number" className="dp-modal-input" value={formData.protein} onChange={e => setFormData({ ...formData, protein: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="dp-modal-group">
              <label className="dp-modal-label">{dt('caloriesLabel')}</label>
              <input type="number" className="dp-modal-input" value={formData.calories} onChange={e => setFormData({ ...formData, calories: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="dp-modal-group">
              <label className="dp-modal-label">{dt('fatLabel')}</label>
              <input type="number" className="dp-modal-input" value={formData.fat} onChange={e => setFormData({ ...formData, fat: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="dp-modal-group">
              <label className="dp-modal-label">{dt('fiberLabel')}</label>
              <input type="number" className="dp-modal-input" value={formData.fiber} onChange={e => setFormData({ ...formData, fiber: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="dp-modal-group" style={{ gridColumn: 'span 2' }}>
              <label className="dp-modal-label">{dt('keyNutrientsLabel')}</label>
              <input className="dp-modal-input" value={formData.keyNutrients} onChange={e => setFormData({ ...formData, keyNutrients: e.target.value })} placeholder="Ex: Vitamin B12, Iron" />
            </div>
            <div className="dp-modal-group" style={{ gridColumn: 'span 2' }}>
              <label className="dp-modal-label">{dt('shortBenefitLabel')}</label>
              <input className="dp-modal-input" value={formData.benefit} onChange={e => setFormData({ ...formData, benefit: e.target.value })} placeholder="Ex: Muscle growth, recovery" />
            </div>
            <div className="dp-modal-group" style={{ gridColumn: 'span 2' }}>
              <label className="dp-modal-label">{dt('imageUrlLabel')}</label>
              <input className="dp-modal-input" value={formData.img} onChange={e => setFormData({ ...formData, img: e.target.value })} placeholder="Unsplash URL, etc." />
            </div>
            <div className="dp-modal-group">
               <label className="dp-modal-check">
                  <input type="checkbox" checked={formData.star} onChange={e => setFormData({...formData, star: e.target.checked})} />
                  {dt('recommendedLabel')}
               </label>
            </div>
          </div>
        </div>
        <div className="dp-modal-footer">
          <button className="dp-btn-cancel" style={{ color: sectionColor }} onClick={onClose}>{dt('cancelBtn')}</button>
          <button className="dp-btn-save" style={{ background: sectionColor }} onClick={() => onSave(formData)}>
            <Save size={18} /> {mode === 'edit' ? dt('updateItemBtn') : dt('addItemBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTipsModal({ tips, onSave, onClose, sectionColor }) {
  const { lang } = useLanguage();
  const dt = (key) => DIET_T[lang]?.[key] || DIET_T['en']?.[key] || key;
  const [formData, setFormData] = useState([...tips]);

  const updateTip = (index, field, value) => {
    const newTips = [...formData];
    newTips[index] = { ...newTips[index], [field]: value };
    setFormData(newTips);
  };

  return (
    <div className="dp-modal-overlay">
      <div className="dp-modal" style={{ maxWidth: '600px' }}>
        <div className="dp-modal-header" style={{ borderColor: sectionColor }}>
          <h2 style={{ color: sectionColor }}><Edit2 size={20} /> {dt('editTipsTitle')}</h2>
          <button className="dp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="dp-modal-body">
          <p className="dp-modal-hint">{dt('editTipsHint')}</p>
          <div className="dp-modal-form">
            {formData.map((t, index) => (
              <div key={index} className="dp-modal-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: '0 0 60px' }}>
                  <label className="dp-modal-label">{dt('iconLabel')}</label>
                  <input 
                    className="dp-modal-input"
                    value={t.icon}
                    onChange={e => updateTip(index, 'icon', e.target.value)}
                    placeholder="💡"
                    style={{ textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: '1' }}>
                  <label className="dp-modal-label">{dt('tipDescriptionLabel')}</label>
                  <textarea 
                    className="dp-modal-textarea"
                    value={t.tip}
                    onChange={e => updateTip(index, 'tip', e.target.value)}
                    placeholder="Enter tip description..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dp-modal-footer">
          <button className="dp-btn-cancel" style={{ color: sectionColor }} onClick={onClose}>{dt('cancelBtn')}</button>
          <button className="dp-btn-save" style={{ background: sectionColor }} onClick={() => onSave(formData)}>
            <Save size={18} /> {dt('saveTipsBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VITAMINS TABLE ────────────────────────────────────────────────────────────────

function getVitaminColor(name) {
  if (name.includes('Vitamin A') || name.includes('విటమిన్ ఎ') || name.includes('विटामिन ए') || name.includes('Vitamina A')) return '#e17055'; // Vibrant Orange/Carrot
  if (name.includes('Vitamin B') || name.includes('విటమిన్ బి') || name.includes('विटामिन बी') || name.includes('Vitamina B')) return '#0984e3'; // Deep Sky Blue
  if (name.includes('Vitamin C') || name.includes('విటమిన్ సి') || name.includes('विटामिन सी') || name.includes('Vitamina C')) return '#fdcb6e'; // Citrus Yellow/Orange
  if (name.includes('Vitamin D') || name.includes('విటమిన్ డి') || name.includes('विटामिन डी') || name.includes('Vitamina D')) return '#f39c12'; // Sun Gold
  if (name.includes('Vitamin E') || name.includes('విటమిన్ ఇ') || name.includes('विटामिन ई') || name.includes('Vitamina E')) return '#00b894'; // Mint/Plant Green
  if (name.includes('Vitamin K') || name.includes('విటమిన్ కె') || name.includes('विटामिन के') || name.includes('Vitamina K')) return '#d63031'; // Blood/Rose Red
  return '#6c5ce7'; // Default Indigo
}

function VitaminsTable({ sectionColor }) {
  const { lang } = useLanguage();
  const dt = (key) => DIET_T[lang]?.[key] || DIET_T['en']?.[key] || key;
  const activeVitamins = LOCALIZED_VITAMINS[lang] || LOCALIZED_VITAMINS['en'];

  return (
    <div className="vp-root" style={{ padding: '0.5rem', animation: 'fadeIn 0.4s ease-in-out' }}>
      <div style={{ 
        background: `linear-gradient(135deg, ${sectionColor} 0%, #4a235a 100%)`, 
        padding: '2rem', 
        borderRadius: '1.5rem', 
        marginBottom: '2rem', 
        boxShadow: `0 15px 30px -10px ${sectionColor}60`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '10rem', opacity: 0.1 }}>💊</div>
        <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '2.2rem', fontWeight: '800', position: 'relative', zIndex: 1 }}>
          {dt('essentialVitaminsGuide')}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: '0.8rem', fontSize: '1.1rem', maxWidth: '800px', position: 'relative', zIndex: 1, lineHeight: '1.6' }}>
          {dt('essentialVitaminsSub')}
        </p>
      </div>

      <div className="fi-table-wrap" style={{ borderRadius: '1.2rem', overflow: 'hidden', border: `1px solid var(--border)`, background: 'var(--surface)', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
        <table className="fi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-color)' }}>
              <th style={{ padding: '1.5rem 1.2rem', color: 'var(--text-main)', fontWeight: '800', borderBottom: `2px solid var(--border)`, width: '25%', textTransform: 'uppercase', letterSpacing: '1px' }}>{dt('vitaminTypeHeader')}</th>
              <th style={{ padding: '1.5rem 1.2rem', color: 'var(--text-main)', fontWeight: '800', borderBottom: `2px solid var(--border)`, width: '25%', textTransform: 'uppercase', letterSpacing: '1px' }}>{dt('primaryFunctionHeader')}</th>
              <th style={{ padding: '1.5rem 1.2rem', color: 'var(--text-main)', fontWeight: '800', borderBottom: `2px solid var(--border)`, width: '50%', textTransform: 'uppercase', letterSpacing: '1px' }}>{dt('foodSourcesHeader')}</th>
            </tr>
          </thead>
          <tbody>
            {activeVitamins.map((item, index) => {
              const vColor = getVitaminColor(item.name);
              return (
                <tr key={index} style={{ borderBottom: index === activeVitamins.length - 1 ? 'none' : `1px solid var(--border)`, background: index % 2 === 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.02)', transition: 'all 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${vColor}0D`}
                    onMouseLeave={e => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.02)'}
                >
                  <td style={{ padding: '1.2rem', borderRight: `1px solid var(--border)` }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: `${vColor}15`, border: `1.5px solid ${vColor}40`, color: vColor, padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: '800', fontSize: '0.95rem', boxShadow: `0 4px 10px ${vColor}20` }}>
                      {item.name}
                    </div>
                  </td>
                  <td style={{ padding: '1.2rem', color: 'var(--text-muted)', borderRight: `1px solid var(--border)`, lineHeight: '1.6', fontWeight: '500' }}>
                    {item.function}
                  </td>
                  <td style={{ padding: '1.2rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                    {item.sources}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mock data for meal planner - will be replaced with real data from Firebase
export interface MealPlanMeal {
    id: string;
    name: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    tag?: string; // e.g., "Pre-Workout", "Hi-Carb", "Omega-3"
    imageUrl?: string;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    recipeId?: string;
    isEaten?: boolean;
}

export interface MealPlanDay {
    date: string; // ISO date string
    dayName: string;
    totalCalories: number;
    meals: MealPlanMeal[];
}

export interface WeeklyMealPlan {
    id: string;
    weekOf: string;
    goal: string;
    isAiGenerated: boolean;
    dailyTargets: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    days: MealPlanDay[];
}

// Sample meal images (placeholder URLs)
const mealImages = {
    oatmeal: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop',
    chicken: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop',
    salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
    pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
    salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    eggs: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
    yogurt: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    steak: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop',
};

// Generate mock weekly meal plan
export function generateMockWeekPlan(): WeeklyMealPlan {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const days: MealPlanDay[] = dayNames.map((dayName, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);

        const meals = generateMealsForDay(dayName, index);
        const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

        return {
            date: date.toISOString().split('T')[0],
            dayName,
            totalCalories,
            meals,
        };
    });

    return {
        id: 'mock-plan-1',
        weekOf: `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        goal: 'Metabolic Flexibility | 300kcal Deficit | High Protein',
        isAiGenerated: true,
        dailyTargets: {
            calories: 2150,
            protein: 180,
            carbs: 200,
            fat: 65,
        },
        days,
    };
}

function generateMealsForDay(_dayName: string, dayIndex: number): MealPlanMeal[] {
    const breakfasts: MealPlanMeal[] = [
        { id: 'b1', recipeId: 'r4', name: 'Pro-Oats w/ Blueberries', type: 'breakfast', tag: 'Pre-Workout', imageUrl: mealImages.oatmeal, protein: 35, carbs: 45, fat: 12, calories: 450 },
        { id: 'b2', recipeId: 'r2', name: 'Avocado Toast & Eggs', type: 'breakfast', imageUrl: mealImages.eggs, protein: 25, carbs: 35, fat: 22, calories: 520 },
        { id: 'b3', recipeId: 'r7', name: 'Greek Yogurt & Walnuts', type: 'breakfast', imageUrl: mealImages.yogurt, protein: 28, carbs: 15, fat: 10, calories: 320 },
        { id: 'b4', recipeId: 'r8', name: 'Protein Pancakes', type: 'breakfast', imageUrl: mealImages.oatmeal, protein: 30, carbs: 50, fat: 10, calories: 450 },
    ];

    const lunches: MealPlanMeal[] = [
        { id: 'l1', recipeId: 'r9', name: 'Grilled Chicken & Quinoa', type: 'lunch', imageUrl: mealImages.chicken, protein: 45, carbs: 40, fat: 15, calories: 620 },
        { id: 'l2', recipeId: 'r6', name: 'Turkey Bolognese Pasta', type: 'lunch', tag: 'Hi-Carb', imageUrl: mealImages.pasta, protein: 40, carbs: 70, fat: 10, calories: 680 },
        { id: 'l3', recipeId: 'r5', name: 'Salmon & Asparagus', type: 'lunch', tag: 'Omega-3', imageUrl: mealImages.salmon, protein: 35, carbs: 10, fat: 25, calories: 580 },
        { id: 'l4', recipeId: 'r10', name: 'Tuna Salad Wrap', type: 'lunch', imageUrl: mealImages.salad, protein: 35, carbs: 30, fat: 12, calories: 420 },
    ];

    const dinners: MealPlanMeal[] = [
        { id: 'd1', name: 'Steak & Sweet Potato', type: 'dinner', tag: 'Recovery', imageUrl: mealImages.steak, protein: 42, carbs: 35, fat: 18, calories: 580 },
        { id: 'd2', recipeId: 'r1', name: 'Herb Roasted Chicken', type: 'dinner', imageUrl: mealImages.chicken, protein: 38, carbs: 20, fat: 14, calories: 480 },
        { id: 'd3', recipeId: 'r5', name: 'Salmon Bowl', type: 'dinner', tag: 'Omega-3', imageUrl: mealImages.salmon, protein: 36, carbs: 45, fat: 20, calories: 550 },
    ];

    const snacks: MealPlanMeal[] = [
        { id: 's1', name: 'Protein Shake', type: 'snack', protein: 25, carbs: 5, fat: 2, calories: 140 },
    ];

    // Rotate meals based on day index
    return [
        breakfasts[dayIndex % breakfasts.length],
        lunches[dayIndex % lunches.length],
        dinners[dayIndex % dinners.length],
        ...(dayIndex % 2 === 0 ? [snacks[0]] : []),
    ];
}

// Mock recipes for configuration
export const mockRecipes = [
    { id: '1', name: 'Herb Roasted Chicken', category: 'Protein', protein: 32 },
    { id: '2', name: 'Turmeric Quinoa', category: 'Carbs', carbs: 45 },
    { id: '3', name: 'Roasted Root Veg', category: 'Fiber', fiber: 8 },
];

// Dietary modes
export const dietaryModes = ['Balanced', 'Keto', 'Vegan', 'High Protein'] as const;
export type DietaryMode = typeof dietaryModes[number];

// Comprehensive mock recipes for Recipe Library
export interface MockRecipe {
    id: string;
    title: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    tags: string[];
    ingredients?: { item: string; amount: string }[];
    instructions?: { step: string; timer?: number }[];
    folders: string[]; // folder IDs
    imageUrl: string;
    cookTime: number; // minutes
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    isFavorite?: boolean;
    source?: 'created' | 'imported';
}

// Recipe Folders
export interface RecipeFolder {
    id: string;
    name: string;
    icon: string;
    color: string;
    isCustom: boolean;
}

export const recipeFolders: RecipeFolder[] = [
    { id: 'breakfast', name: 'Breakfast', icon: 'egg_alt', color: 'amber-400', isCustom: false },
    { id: 'lunch', name: 'Lunch', icon: 'restaurant', color: 'blue-400', isCustom: false },
    { id: 'dinner', name: 'Dinner', icon: 'dinner_dining', color: 'purple-400', isCustom: false },
    { id: 'slow-cook', name: 'Slow Cook', icon: 'slow_motion_video', color: 'orange-400', isCustom: false },
    { id: 'meal-prep', name: 'Meal Prep', icon: 'kitchen', color: 'green-400', isCustom: false },
    { id: 'quick-easy', name: 'Quick & Easy', icon: 'bolt', color: 'yellow-400', isCustom: false },
];

export const mockRecipeLibrary: MockRecipe[] = [
    {
        id: 'r1',
        title: 'Grilled Lemon Herb Chicken',
        mealType: 'dinner',
        tags: ['High Protein', 'Keto'],
        ingredients: [
            { item: 'Chicken Breast', amount: '2 lbs' },
            { item: 'Lemon', amount: '2, juice and zest' },
            { item: 'Olive Oil', amount: '1/4 cup' },
            { item: 'Garlic', amount: '4 cloves, minced' },
            { item: 'Dried Oregano', amount: '1 tbsp' },
            { item: 'Salt & Pepper', amount: 'to taste' },
            { item: 'Thyme', amount: '1 tsp' }
        ],
        instructions: [
            { step: 'In a small bowl, whisk together lemon juice, zest, olive oil, garlic, oregano, thyme, salt, and pepper.' },
            { step: 'Place chicken breasts in a large ziploc bag and pour the marinade over them. Seal and massage to coat. Marinate for at least 30 minutes in the fridge.', timer: 1800 },
            { step: 'Preheat grill to medium-high heat. Oil the grates lightly.' },
            { step: 'Grill chicken for 6-7 minutes per side, or until internal temperature reaches 165°F (74°C).', timer: 420 },
            { step: 'Let rest for 5 minutes before slicing. Serve with lemon wedges.', timer: 300 }
        ],
        folders: ['dinner', 'meal-prep'],
        imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop',
        cookTime: 25,
        calories: 450,
        protein: 45,
        carbs: 10,
        fat: 20,
        isFavorite: true,
        source: 'created',
    },
    {
        id: 'r2',
        title: 'Avocado Toast & Egg',
        mealType: 'breakfast',
        tags: ['Quick', 'Vegetarian'],
        ingredients: [
            { item: 'Whole Grain Bread', amount: '2 slices' },
            { item: 'Ripe Avocado', amount: '1' },
            { item: 'Eggs', amount: '2' },
            { item: 'Red Pepper Flakes', amount: 'pinch' },
            { item: 'Salt', amount: 'pinch' }
        ],
        instructions: [
            { step: 'Toast the bread slices until golden brown.', timer: 180 },
            { step: 'While bread toasts, fry eggs in a pan with a little oil to your desired doneness.', timer: 240 },
            { step: 'Mash the avocado in a bowl with a pinch of salt.' },
            { step: 'Spread avocado on toast, top with fried egg, and sprinkle with red pepper flakes.' }
        ],
        folders: ['breakfast', 'quick-easy'],
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
        cookTime: 10,
        calories: 320,
        protein: 18,
        carbs: 24,
        fat: 16,
        source: 'imported',
    },
    {
        id: 'r3',
        title: 'Quinoa Power Bowl',
        mealType: 'lunch',
        tags: ['Vegan', 'High Fiber'],
        ingredients: [
            { item: 'Quinoa', amount: '1 cup, cooked' },
            { item: 'Chickpeas', amount: '1/2 cup, rinsed' },
            { item: 'Cucumber', amount: '1/2 cup, diced' },
            { item: 'Cherry Tomatoes', amount: '1/2 cup, halved' },
            { item: 'Hummus', amount: '2 tbsp' }
        ],
        instructions: [
            { step: 'Cook quinoa according to package instructions.', timer: 900 },
            { step: 'Chop all vegetables.' },
            { step: 'Assemble bowl with quinoa base, topped with chickpeas, veggies, and a dollop of hummus.' }
        ],
        folders: ['lunch', 'meal-prep'],
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        cookTime: 40,
        calories: 380,
        protein: 12,
        carbs: 55,
        fat: 14,
        source: 'created',
    },
    {
        id: 'r4',
        title: 'Berry Overnight Oats',
        mealType: 'breakfast',
        tags: ['Meal Prep', 'No Cook'],
        folders: ['breakfast', 'meal-prep'],
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
        cookTime: 15,
        calories: 290,
        protein: 10,
        carbs: 48,
        fat: 6,
        isFavorite: true,
        source: 'imported',
    },
    {
        id: 'r5',
        title: 'Salmon & Asparagus',
        mealType: 'dinner',
        tags: ['Keto', 'Omega-3'],
        folders: ['dinner', 'quick-easy'],
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
        cookTime: 20,
        calories: 420,
        protein: 38,
        carbs: 4,
        fat: 28,
        isFavorite: true,
        source: 'created',
    },
    {
        id: 'r6',
        title: 'Turkey Bolognese Pasta',
        mealType: 'dinner',
        tags: ['Meal Prep', 'High Protein'],
        folders: ['dinner', 'slow-cook'],
        imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
        cookTime: 35,
        calories: 520,
        protein: 35,
        carbs: 55,
        fat: 12,
        source: 'imported',
    },
    {
        id: 'r7',
        title: 'Greek Yogurt & Walnuts',
        mealType: 'breakfast',
        tags: ['Quick', 'Vegetarian'],
        ingredients: [{ item: 'Greek Yogurt', amount: '1 cup' }, { item: 'Walnuts', amount: '1/4 cup' }, { item: 'Honey', amount: '1 tsp' }],
        folders: ['breakfast'],
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
        cookTime: 5,
        calories: 320,
        protein: 28,
        carbs: 15,
        fat: 10,
    },
    {
        id: 'r8',
        title: 'Protein Pancakes',
        mealType: 'breakfast',
        tags: ['High Protein'],
        ingredients: [{ item: 'Pancake Mix', amount: '1/2 cup' }, { item: 'Protein Powder', amount: '1 scoop' }, { item: 'Milk', amount: '1/2 cup' }],
        folders: ['breakfast'],
        imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
        cookTime: 15,
        calories: 450,
        protein: 30,
        carbs: 50,
        fat: 10,
    },
    {
        id: 'r9',
        title: 'Grilled Chicken & Quinoa',
        mealType: 'lunch',
        tags: ['High Protein'],
        ingredients: [{ item: 'Chicken Breast', amount: '6 oz' }, { item: 'Quinoa', amount: '0.5 cup' }, { item: 'Asparagus', amount: '1 cup' }],
        folders: ['lunch'],
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        cookTime: 20,
        calories: 620,
        protein: 45,
        carbs: 40,
        fat: 15,
    },
    {
        id: 'r10',
        title: 'Tuna Salad Wrap',
        mealType: 'lunch',
        tags: ['Quick'],
        ingredients: [{ item: 'Canned Tuna', amount: '1 can' }, { item: 'Tortilla', amount: '1' }, { item: 'Lettuce', amount: '2 leaves' }],
        folders: ['lunch'],
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        cookTime: 10,
        calories: 420,
        protein: 35,
        carbs: 30,
        fat: 12,
    },
];

// Mock history weeks for History page
export interface HistoryWeek {
    id: string;
    weekStart: string; // ISO date
    weekEnd: string;
    totalMeals: number;
    completedMeals: number;
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    adherence: number; // percentage
    goal: string;
}

export function generateMockHistory(): HistoryWeek[] {
    const weeks: HistoryWeek[] = [];
    const today = new Date();

    for (let i = 0; i < 8; i++) {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);

        weeks.push({
            id: `week-${i}`,
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            totalMeals: 21,
            completedMeals: i === 0 ? 12 : 21 - Math.floor(Math.random() * 4),
            avgCalories: 2100 + Math.floor(Math.random() * 200 - 100),
            avgProtein: 175 + Math.floor(Math.random() * 20 - 10),
            avgCarbs: 190 + Math.floor(Math.random() * 30 - 15),
            avgFat: 65 + Math.floor(Math.random() * 10 - 5),
            adherence: i === 0 ? 57 : 85 + Math.floor(Math.random() * 15),
            goal: i % 2 === 0 ? 'Fat Loss' : 'Maintenance',
        });
    }

    return weeks;
}

export interface TrainingCourse {
  id: string;
  name: string;
  costMinor: number;
  durationDays: number;
  skillGain: number;
}

export const TRAINING_COURSES: readonly TrainingCourse[] = [
  {
    id: "customer_service_101",
    name: "Customer Service Basics",
    costMinor: 300_00, // 300 DM
    durationDays: 2,
    skillGain: 8,
  },
  {
    id: "advanced_hospitality",
    name: "Advanced Hospitality Management",
    costMinor: 800_00, // 800 DM
    durationDays: 5,
    skillGain: 15,
  },
  {
    id: "technical_maintenance",
    name: "Facility & Engineering Safety",
    costMinor: 500_00, // 500 DM
    durationDays: 3,
    skillGain: 10,
  },
  {
    id: "fnb_hygiene",
    name: "Food & Beverage Safety Standards",
    costMinor: 400_00, // 400 DM
    durationDays: 2,
    skillGain: 8,
  },
];

export function findTrainingCourse(courseId: string): TrainingCourse | null {
  return TRAINING_COURSES.find((c) => c.id === courseId) ?? null;
}


import { PrismaClient } from './app/generated/prisma';

async function test() {
  const prisma = new PrismaClient();
  try {
    const patientBirthDate = ""; // Simulate empty string from form
    const age = patientBirthDate ? new Date().getFullYear() - new Date(patientBirthDate).getFullYear() : null;
    console.log("Calculated Age:", age);
    
    // This is what would fail if age is NaN
    if (age !== null && isNaN(age)) {
        console.error("Age is NaN!");
    }

    const birthDate = patientBirthDate ? new Date(patientBirthDate) : null;
    console.log("Birth Date:", birthDate);
    if (birthDate instanceof Date && isNaN(birthDate.getTime())) {
        console.error("Birth Date is Invalid Date!");
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

test();

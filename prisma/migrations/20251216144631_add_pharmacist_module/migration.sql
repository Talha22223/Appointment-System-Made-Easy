-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'rejected';

-- CreateTable
CREATE TABLE "pharmacists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "speciality" TEXT NOT NULL DEFAULT 'General Pharmacy',
    "degree" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "about" TEXT NOT NULL DEFAULT '',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "address" JSONB DEFAULT '{}',
    "slotsBooked" JSONB DEFAULT '{}',
    "role" TEXT NOT NULL DEFAULT 'pharmacist',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacist_appointments" (
    "id" TEXT NOT NULL,
    "pharmacistId" TEXT,
    "pharmacistDetails" JSONB DEFAULT '{}',
    "userId" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'Medication Consultation',
    "method" "AppointmentMethod" NOT NULL DEFAULT 'In Person',
    "notes" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacist_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pharmacists_email_key" ON "pharmacists"("email");

-- AddForeignKey
ALTER TABLE "pharmacist_appointments" ADD CONSTRAINT "pharmacist_appointments_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "pharmacists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacist_appointments" ADD CONSTRAINT "pharmacist_appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

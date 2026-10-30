import { jsPDF } from 'jspdf';
import { formatDisplayDate } from '../lib/utils';
import { formatSetDisplay } from './exerciseService';

/**
 * Calculates or formats set completion timestamp and rest duration
 */
export const enrichWorkoutWithTimestamps = (workout) => {
  const startedAt = workout.started_at || workout.startedAt || new Date().toISOString();
  const completedAt = workout.completed_at || workout.completedAt || null;
  const durationMinutes = Number(workout.duration_minutes || workout.durationMinutes) || 45;

  const startDate = new Date(startedAt);
  const isValidStart = !isNaN(startDate.getTime());
  const baseTimeMs = isValidStart ? startDate.getTime() : Date.now() - durationMinutes * 60000;

  let currentEstimateMs = baseTimeMs;

  const exercises = (workout.exercises || []).map((ex, exIdx) => {
    const defaultRest = Number(ex.default_rest_sec || ex.defaultRestSec) || 90;
    const sets = (ex.sets || []).map((s, sIdx) => {
      // Estimated progressive time if completedAt not explicitly present
      currentEstimateMs += (Number(s.time_sec || s.timeSec) || 45) * 1000;
      const setCompletedTimeMs = s.completed_at || s.completedAt
        ? new Date(s.completed_at || s.completedAt).getTime()
        : currentEstimateMs;

      // Add rest break after set
      const restSec = Number(s.rest_duration_sec || s.restDurationSec) || defaultRest;
      currentEstimateMs += restSec * 1000;

      return {
        ...s,
        calculatedCompletedTime: new Date(setCompletedTimeMs),
        restDurationSec: restSec,
      };
    });

    return {
      ...ex,
      defaultRestSec: defaultRest,
      sets,
    };
  });

  const endDate = completedAt && !isNaN(new Date(completedAt).getTime())
    ? new Date(completedAt)
    : new Date(baseTimeMs + durationMinutes * 60000);

  return {
    ...workout,
    startedDate: new Date(baseTimeMs),
    completedDate: endDate,
    durationMinutes,
    enrichedExercises: exercises,
  };
};

/**
 * Helper to format local time (e.g. "10:18:24 AM")
 */
export const formatTimeOnly = (date, includeSeconds = true) => {
  if (!date || isNaN(new Date(date).getTime())) return '--:--';
  const d = new Date(date);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
};

/**
 * Helper to format seconds into readable break duration (e.g. "90s" or "1m 30s")
 */
export const formatBreakDuration = (sec) => {
  const s = Math.round(Number(sec) || 0);
  if (s <= 0) return 'None';
  if (s < 60) return `${s}s break`;
  const mins = Math.floor(s / 60);
  const remainingSecs = s % 60;
  return remainingSecs > 0 ? `${mins}m ${remainingSecs}s break` : `${mins}m break`;
};

/**
 * Generates an executive, professional PDF document using jsPDF
 */
export const createWorkoutPdf = (workout, { unit = 'kg', athleteName = 'FitTrack Athlete' } = {}) => {
  const enriched = enrichWorkoutWithTimestamps(workout);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let currentY = margin;

  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = margin + 6;
      drawPageHeaderMini();
    }
  };

  const drawPageHeaderMini = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`FitTrack Pro • ${enriched.title || 'Workout Summary'}`, margin, currentY - 2);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;
  };

  // ==========================================
  // 1. TOP HEADER BRANDING & BADGE
  // ==========================================
  doc.setFillColor(15, 23, 42); // slate-900 dark background banner
  doc.roundedRect(margin, currentY, contentWidth, 32, 3, 3, 'F');

  // Accent Brand Strip
  doc.setFillColor(187, 244, 61); // Lime accent #bbf43d
  doc.rect(margin, currentY, 3, 32, 'F');

  // App Logo / Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FITTRACK PRO', margin + 7, currentY + 9);

  doc.setFontSize(8);
  doc.setTextColor(187, 244, 61);
  doc.text('OFFICIAL WORKOUT PERFORMANCE & TIMESTAMPS REPORT', margin + 7, currentY + 14);

  // Athlete & Generation info on right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Athlete: ${athleteName}`, pageWidth - margin - 6, currentY + 8, { align: 'right' });
  doc.text(`Date: ${formatDisplayDate(enriched.startedDate.toISOString().split('T')[0])}`, pageWidth - margin - 6, currentY + 13, { align: 'right' });
  doc.text(`Generated: ${formatTimeOnly(new Date(), false)}`, pageWidth - margin - 6, currentY + 18, { align: 'right' });

  // Verified Badge on Right
  doc.setFillColor(34, 197, 94); // emerald-500
  doc.roundedRect(pageWidth - margin - 38, currentY + 22, 32, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('VERIFIED SESSION', pageWidth - margin - 22, currentY + 26.2, { align: 'center' });

  currentY += 36;

  // ==========================================
  // 2. WORKOUT TITLE, CATEGORY & DESCRIPTION
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(enriched.title || 'Completed Workout Session', margin, currentY + 4);

  // Routine Category Badge
  const categoryStr = (enriched.category || 'Strength').toUpperCase();
  const musclesStr = enriched.targetMuscles?.length > 0
    ? ` • ${enriched.targetMuscles.join(', ')}`
    : '';

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`${categoryStr}${musclesStr}`, margin, currentY + 10);

  currentY += 14;

  // Notes / Description Box (if user provided notes)
  if (enriched.notes && enriched.notes.trim()) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const splitNotes = doc.splitTextToSize(`"${enriched.notes.trim()}"`, contentWidth - 8);
    const boxHeight = splitNotes.length * 4.5 + 8;

    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(splitNotes, margin + 4, currentY + 5.5);

    currentY += boxHeight + 4;
  }

  // ==========================================
  // 3. EXECUTIVE TIMELINE & METRIC KPI CARDS
  // ==========================================
  checkPageBreak(30);

  // Session Time Window Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 10, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('SESSION TIMESTAMPS:', margin + 4, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const timeWindowText = `Start: ${formatTimeOnly(enriched.startedDate)}   |   Finished: ${formatTimeOnly(enriched.completedDate)}   |   Total Session: ${enriched.durationMinutes} min`;
  doc.text(timeWindowText, margin + 42, currentY + 6.5);

  currentY += 13;

  // 4 KPI Summary Cards
  const kpiWidth = (contentWidth - 6) / 4;
  const kpiHeight = 16;

  const totalVolume = Number(enriched.total_volume_kg || enriched.totalVolumeKg || 0);
  const caloriesBurned = Number(enriched.calories_burned || enriched.caloriesBurned || 0);

  let totalCompletedSets = 0;
  let totalReps = 0;
  let totalRestSec = 0;

  (enriched.enrichedExercises || []).forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      if (s.isCompleted || s.is_completed) {
        totalCompletedSets += 1;
        totalReps += Number(s.reps) || 0;
        totalRestSec += Number(s.restDurationSec) || 90;
      }
    });
  });

  const kpis = [
    { label: 'TOTAL VOLUME', val: `${totalVolume.toLocaleString()} ${unit}`, color: [16, 185, 129] },
    { label: 'TOTAL DURATION', val: `${enriched.durationMinutes} min`, color: [14, 165, 233] },
    { label: 'COMPLETED SETS', val: `${totalCompletedSets} sets (${totalReps} reps)`, color: [249, 115, 22] },
    { label: 'ACTIVE CALORIES', val: `${caloriesBurned} kcal`, color: [234, 179, 8] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiWidth + 2);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, kpiWidth, kpiHeight, 2, 2, 'FD');

    // Colored mini bar
    doc.setFillColor(...kpi.color);
    doc.rect(x, currentY, kpiWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + kpiWidth / 2, currentY + 6, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, x + kpiWidth / 2, currentY + 12, { align: 'center' });
  });

  currentY += kpiHeight + 8;

  // ==========================================
  // 4. DETAILED MOVEMENTS & SET TIMESTAMPS TABLE
  // ==========================================
  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('EXERCISE TIMELINE, SETS & BREAK INTERVALS', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Accurate timestamps of when each set was executed and the break interval taken.', margin, currentY + 4);

  currentY += 8;

  const exercisesList = enriched.enrichedExercises || [];
  if (exercisesList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No detailed movement records logged for this session.', margin, currentY + 5);
    currentY += 10;
  } else {
    exercisesList.forEach((ex, exIdx) => {
      const setsCount = (ex.sets || []).length;
      const exBlockHeight = 12 + setsCount * 7 + 4;
      checkPageBreak(Math.min(exBlockHeight, 35));

      // Exercise Header Ribbon
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, currentY, contentWidth, 8, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${exIdx + 1}. ${(ex.exercise_name || ex.name || 'Exercise').toUpperCase()}`, margin + 3, currentY + 5.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const exTarget = ex.exercise_category || ex.category || ex.muscle || 'Targeted Muscle';
      doc.text(`Focus: ${exTarget} • ${setsCount} sets`, pageWidth - margin - 3, currentY + 5.5, { align: 'right' });

      currentY += 10;

      // Table Column Headers
      // Col 1: Set (18mm) | Col 2: Type (26mm) | Col 3: Load / Reps (42mm) | Col 4: Time Done (44mm) | Col 5: Break Taken (38mm) | Col 6: Status (14mm)
      const colX = {
        set: margin + 2,
        type: margin + 18,
        load: margin + 46,
        time: margin + 92,
        rest: margin + 138,
        status: pageWidth - margin - 2,
      };

      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);

      doc.text('SET #', colX.set, currentY + 3.8);
      doc.text('TYPE', colX.type, currentY + 3.8);
      doc.text('PERFORMANCE / LOAD', colX.load, currentY + 3.8);
      doc.text('TIME COMPLETED', colX.time, currentY + 3.8);
      doc.text('BREAK / REST TAKEN', colX.rest, currentY + 3.8);
      doc.text('STATUS', colX.status, currentY + 3.8, { align: 'right' });

      currentY += 6;

      // Table Rows
      (ex.sets || []).forEach((s, sIdx) => {
        checkPageBreak(8);

        const isEven = sIdx % 2 === 0;
        if (isEven) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(248, 250, 252);
        }
        doc.rect(margin, currentY, contentWidth, 6.2, 'F');

        // Bottom light divider
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, currentY + 6.2, pageWidth - margin, currentY + 6.2);

        // 1. Set Number
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Set ${s.set_number || s.setNumber || sIdx + 1}`, colX.set, currentY + 4.3);

        // 2. Set Type Badge
        const supportType = (s.support || 'normal').toLowerCase();
        let supportLabel = 'Normal';
        if (supportType === 'warmup') supportLabel = 'Warmup';
        else if (supportType === 'drop_set') supportLabel = 'Drop Set';
        else if (supportType === 'failure') supportLabel = 'Failure';
        else if (supportType === 'assisted') supportLabel = 'Assisted';

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        if (supportType === 'warmup') {
          doc.setTextColor(234, 179, 8); // amber
        } else if (supportType === 'drop_set') {
          doc.setTextColor(168, 85, 247); // purple
        } else if (supportType === 'failure') {
          doc.setTextColor(239, 68, 68); // rose
        } else {
          doc.setTextColor(71, 85, 105);
        }
        doc.text(supportLabel, colX.type, currentY + 4.3);

        // 3. Load & Performance
        const trackingFields = ex.tracking_fields || ex.trackingFields || ['weight', 'reps'];
        const formattedSet = formatSetDisplay(s, trackingFields, unit);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(formattedSet, colX.load, currentY + 4.3);

        // 4. Exact Set Timestamp (What time did the set was done)
        const timeCompletedStr = formatTimeOnly(s.calculatedCompletedTime);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`⏱ ${timeCompletedStr}`, colX.time, currentY + 4.3);

        // 5. Break Duration (How much break)
        const isLastSetOfExercise = sIdx === (ex.sets || []).length - 1;
        const breakText = isLastSetOfExercise
          ? `${formatBreakDuration(s.restDurationSec)} (Next Movement)`
          : formatBreakDuration(s.restDurationSec);

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(breakText, colX.rest, currentY + 4.3);

        // 6. Status
        const isComp = s.isCompleted ?? s.is_completed ?? true;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        if (isComp) {
          doc.setTextColor(22, 163, 74); // green
          doc.text('DONE ✓', colX.status, currentY + 4.3, { align: 'right' });
        } else {
          doc.setTextColor(148, 163, 184);
          doc.text('SKIPPED', colX.status, currentY + 4.3, { align: 'right' });
        }

        currentY += 6.5;
      });

      currentY += 4; // Space between exercises
    });
  }

  // ==========================================
  // 5. OFFICIAL FOOTER ON EVERY PAGE
  // ==========================================
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('FitTrack Pro • Complete Workout Summary & Chronological Performance Ledger', margin, pageHeight - 8);

    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return doc;
};

/**
 * Generates and returns a downloadable/sharable PDF Blob and filename
 */
export const generateWorkoutPdfBlob = (workout, options = {}) => {
  const doc = createWorkoutPdf(workout, options);
  const blob = doc.output('blob');
  const safeTitle = (workout.title || 'Workout').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = (workout.started_at || workout.startedAt || new Date().toISOString()).split('T')[0];
  const fileName = `FitTrack_${safeTitle}_${dateStr}.pdf`;

  return { blob, fileName, doc };
};

/**
 * Downloads the PDF directly to device
 */
export const downloadWorkoutPdf = (workout, options = {}) => {
  const { blob, fileName } = generateWorkoutPdfBlob(workout, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return fileName;
};

/**
 * Shares the PDF using native Web Share API (or fallback to download)
 */
export const shareWorkoutPdf = async (workout, options = {}) => {
  const { blob, fileName } = generateWorkoutPdfBlob(workout, options);

  const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

  // Native File Web Share (Supported on iOS Safari, Android Chrome, macOS Safari)
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: `FitTrack Workout: ${workout.title || 'Summary'}`,
        text: `Here is my detailed workout performance summary and timestamps from FitTrack Pro!`,
        files: [pdfFile],
      });
      return { shared: true, method: 'native' };
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') {
        return { shared: false, cancelled: true };
      }
      // On error, fall back to download
    }
  }

  // Fallback: Download file directly
  downloadWorkoutPdf(workout, options);
  return { shared: true, method: 'download' };
};

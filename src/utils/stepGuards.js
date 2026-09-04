/**
 * Shared, database-driven step completion guards.
 * Ensures all components (ProjectOS, Phase1Validate, Phase2BuildMVP, Phase3Launch)
 * have 100% synchronized and consistent step status derived directly from PostgreSQL/database records.
 */

export function parseThresholdAmount(str) {
  if (!str) return 0;
  const match = String(str).replace(/,/g, '').match(/\$(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function getPhase1StepGuards(project = {}) {
  const derivedGoal = parseThresholdAmount(project.validationPlan?.threshold || project.threshold);
  const presaleGoal = derivedGoal > 0 ? derivedGoal : Number(project.presaleTarget || project.targetRevenue || 5000);
  const currentPresales = Number(String(project.currentPresales || 0).replace(/[^0-9.]/g, '')) ||
    (Array.isArray(project.reservations) ? project.reservations.reduce((acc, r) => acc + (Number(r.amount) || 0), 0) : 0);
  const projectCurrentPhase = Number(project.currentPhase || project.current_phase || (project.status === 'building' ? 2 : project.status === 'launched' ? 3 : 1));

  // Step 1: Validation Plan Specification
  const isStep1Done = Boolean(
    project.planLocked === true ||
    project.validationPlan?.locked === true ||
    project.validationPlan?.approved === true ||
    project.validationPlan?.status === 'approved' ||
    project.validationPlan?.status === 'locked' ||
    project.validationPlan?.status === 'ready' ||
    Boolean(project.validationPlan?.threshold && project.validationPlan?.offer) ||
    Boolean(project.validationPlan?.threshold && project.validationPlan?.customer)
  );

  // Step 2: Build Validation Assets (Landing page, presale funnel, checkout)
  const isStep2Done = Boolean(
    project.validationCampaign?.reviewStatus === 'approved' ||
    project.validationCampaign?.review_status === 'approved' ||
    project.assetsApproved === true ||
    project.landingPageApproved === true
  );

  // Step 3: Creator Campaign (7-day sprint launch & daily tasks)
  // ONLY done when the campaign has actually been launched or tasks completed
  const isStep3Done = Boolean(
    project.campaignLaunched === true ||
    project.campaignKit?.launched === true ||
    ((project.creatorTasks || []).length > 0 && project.creatorTasks.every(t => t.done || t.completed || t.status === 'completed')) ||
    ((project.campaignKit?.postingSchedule || []).length > 0 && project.campaignKit.postingSchedule.every(t => t.done))
  );

  // Step 4: Run & Optimize (Live telemetry, reservations, meeting validation goal)
  const isStep4Done = Boolean(
    (Array.isArray(project.reservations) && project.reservations.length >= 3) ||
    (presaleGoal > 0 && currentPresales >= presaleGoal && (project.reservations?.length || 0) > 0)
  );

  // Step 5: Validation Gate Checkpoint
  const isGatePassed = Boolean(
    project.p1Complete === true ||
    project.phase1Passed === true ||
    (Array.isArray(project.gateDecisions) && project.gateDecisions.some(d => (d.decision === 'pass_to_phase2' || d.gateStatus === 'passed' || d.decision === 'pass') && d.phase !== 3)) ||
    (presaleGoal > 0 && currentPresales >= presaleGoal && (project.reservations?.length || 0) > 0) ||
    ((project.gateDecisions?.length || 0) > 0 && projectCurrentPhase > 1)
  );

  const isStep5Done = isGatePassed;

  return {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    isGatePassed,
    presaleGoal,
    currentPresales
  };
}

export function getPhase2StepGuards(project = {}, { buildPlan, engineeringTasks, feedbackClusters } = {}) {
  const plan = buildPlan || project?.mvpBuildPlan;
  const tasks = engineeringTasks || project?.engineeringTasks || [];
  const clusters = feedbackClusters || project?.feedbackClusters || [];

  const isStep1Done = Boolean(
    (plan && (plan.productSpec || plan.technicalPlan) && (plan.status === 'approved' || plan.locked === true)) ||
    (project?.mvpBuildPlan && (project.mvpBuildPlan.approved === true || project.mvpBuildPlan.locked === true || project.mvpBuildPlan.status === 'approved')) ||
    project?.buildPlanApproved === true
  );

  const isStep2Done = Boolean(
    Array.isArray(tasks) && tasks.length > 0 && tasks.every(t => t.status === 'Completed' || t.status === 'done')
  );

  const isStep3Done = Boolean(
    project?.betaTestingCompleted === true ||
    project?.betaApproved === true ||
    project?.phase2BetaDone === true ||
    (Array.isArray(clusters) && clusters.length > 0 && Array.isArray(project?.betaFeedback) && project.betaFeedback.some(f => f.approved || f.resolved))
  );

  const isP2Done = Boolean(
    project?.p2Complete === true ||
    project?.phase2Passed === true ||
    project?.launchReadinessReport ||
    project?.readinessReport ||
    project?.status === 'ready_for_phase3' ||
    project?.status === 'launched' ||
    Number(project?.currentPhase || project?.current_phase || 1) > 2
  );

  const isStep4Done = isP2Done;

  return {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isP2Done
  };
}

export function getPhase3StepGuards(project = {}, { strategy, telemetry, launchManager, launchReport, decisionNotice } = {}) {
  const strat = strategy || project?.phase3Strategy || {};
  const isLive = Boolean(project?.launchStatus === 'LIVE' || project?.isLive === true || strat?.productionLive === true);

  const isStep1Done = Boolean(
    strat?.strategyLocked === true ||
    strat?.approved === true ||
    ((strat.creatorChecklist || []).length > 0 &&
      (strat.creatorChecklist || []).every(t => Boolean(t.done)) &&
      (strat.opsChecklist || []).length > 0 &&
      (strat.opsChecklist || []).every(t => Boolean(t.done)))
  );

  const isStep2Done = Boolean(isLive && ((telemetry?.revenue || 0) > 0 || (telemetry?.customers || 0) > 0));

  const isStep3Done = Boolean(
    (launchManager?.automatedActions || []).length > 0 &&
    (launchManager.automatedActions || []).every(a => (launchManager?.dispatchedActions || []).includes(a.id))
  );

  const isStep4Done = Boolean(launchReport && (launchReport.score || 0) > 0 && decisionNotice);

  return {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done
  };
}

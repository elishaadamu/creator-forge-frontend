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
    projectCurrentPhase > 1 ||
    project.planLocked === true ||
    project.validationPlan?.locked === true ||
    project.validationPlan?.approved === true ||
    project.validationPlan?.status === 'approved' ||
    project.validationPlan?.status === 'locked' ||
    project.validationPlan?.status === 'ready' ||
    project.assetsApproved === true ||
    project.landingPageApproved === true ||
    project.validationCampaign?.reviewStatus === 'approved' ||
    project.validationCampaign?.review_status === 'approved' ||
    Boolean(project.validationPlan?.threshold && project.validationPlan?.offer) ||
    Boolean(project.validationPlan?.threshold && project.validationPlan?.customer)
  );

  // Step 2: Build Validation Assets (Requires Step 1 to be done)
  const isStep2Done = Boolean(
    projectCurrentPhase > 1 ||
    project.assetsApproved === true ||
    project.landingPageApproved === true ||
    project.validationCampaign?.reviewStatus === 'approved' ||
    project.validationCampaign?.review_status === 'approved' ||
    (isStep1Done && (
      project.validationCampaign?.reviewStatus === 'approved' ||
      project.validationCampaign?.review_status === 'approved' ||
      project.assetsApproved === true ||
      project.landingPageApproved === true
    ))
  );

  // Step 3: Creator Campaign (Requires Step 1 AND Step 2 to be done)
  const resolvedKit = project.campaignKit || project.validationCampaign?.campaign_kit || project.validationCampaign?.campaignKit;
  const isStep3Done = Boolean(
    projectCurrentPhase > 1 ||
    (isStep1Done && isStep2Done && (
      project.campaignApproved === true ||
      project.step3Done === true ||
      (resolvedKit && (
        (Array.isArray(resolvedKit.postingSchedule) && resolvedKit.postingSchedule.length > 0) ||
        Boolean(resolvedKit.announcementPost?.trim()) ||
        Boolean(resolvedKit.storySequence?.trim()) ||
        Boolean(resolvedKit.videoScript?.trim()) ||
        Boolean(resolvedKit.newsletterDraft?.trim())
      ))
    ))
  );

  // Step 4: Run & Optimize (Requires Step 1, 2, AND 3 to be done)
  const isStep4Done = Boolean(
    projectCurrentPhase > 1 ||
    (isStep1Done && isStep2Done && isStep3Done && (
      project.step4Done === true ||
      project.validationOptimized === true ||
      project.telemetryReviewed === true ||
      (Array.isArray(project.reservations) && project.reservations.length >= 3) ||
      (presaleGoal > 0 && currentPresales >= presaleGoal && (project.reservations?.length || 0) > 0) ||
      (Array.isArray(project.experiments) && project.experiments.length > 0) ||
      (project.telemetry && (project.telemetry.experimentsRun > 0 || project.telemetry.visitors > 0))
    ))
  );

  // Step 5: Validation Gate Checkpoint
  // STRICT SEQUENTIAL PREREQUISITE: Gate can ONLY be passed if Steps 1, 2, 3, and 4 are ALL completed!
  const allPriorStepsDone = Boolean(isStep1Done && isStep2Done && isStep3Done && isStep4Done);

  const isGatePassed = Boolean(
    allPriorStepsDone && (
      project.p1Complete === true ||
      project.phase1Passed === true ||
      (Array.isArray(project.gateDecisions) && project.gateDecisions.some(d => (d.decision === 'pass_to_phase2' || d.gateStatus === 'passed' || d.decision === 'pass') && d.phase !== 3)) ||
      ((project.gateDecisions?.length || 0) > 0 && projectCurrentPhase > 1)
    )
  );

  const isStep5Done = isGatePassed;

  // Step access unlock status (each step requires the preceding step to be completed)
  const canAccessStep1 = true;
  const canAccessStep2 = isStep1Done;
  const canAccessStep3 = isStep1Done && isStep2Done;
  const canAccessStep4 = isStep1Done && isStep2Done && isStep3Done;
  const canAccessStep5 = allPriorStepsDone;

  return {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    isGatePassed,
    allPriorStepsDone,
    canAccessStep1,
    canAccessStep2,
    canAccessStep3,
    canAccessStep4,
    canAccessStep5,
    presaleGoal,
    currentPresales
  };
}

export function getPhase2StepGuards(project = {}, { buildPlan, engineeringTasks, feedbackClusters } = {}) {
  const plan = buildPlan || project?.mvpBuildPlan;
  const tasks = engineeringTasks || project?.engineeringTasks || [];
  const clusters = feedbackClusters || project?.feedbackClusters || [];
  const projectCurrentPhase = Number(project?.currentPhase || project?.current_phase || 1);

  // Step 1: Product + Build Plan
  const isStep1Done = Boolean(
    (plan && (plan.productSpec || plan.technicalPlan) && (plan.status === 'approved' || plan.locked === true)) ||
    (project?.mvpBuildPlan && (project.mvpBuildPlan.approved === true || project.mvpBuildPlan.locked === true || project.mvpBuildPlan.status === 'approved')) ||
    project?.buildPlanApproved === true ||
    projectCurrentPhase > 2
  );

  // Step 2: Build MVP (Engineering Build) - Requires Step 1
  const isStep2Done = Boolean(
    isStep1Done && (
      (Array.isArray(tasks) && tasks.length > 0 && tasks.every(t => t.status === 'Completed' || t.status === 'done')) ||
      project?.buildCompleted === true ||
      project?.mvpBuildDone === true ||
      projectCurrentPhase > 2
    )
  );

  // Step 3: Beta Test - Requires Step 1 and Step 2
  const isStep3Done = Boolean(
    isStep1Done && isStep2Done && (
      project?.betaTestingCompleted === true ||
      project?.betaApproved === true ||
      project?.phase2BetaDone === true ||
      (Array.isArray(clusters) && clusters.length > 0 && Array.isArray(project?.betaFeedback) && project.betaFeedback.some(f => f.approved || f.resolved)) ||
      projectCurrentPhase > 2
    )
  );

  // Step 4: Iterate + Launch Gate - Requires Step 1, 2, and 3
  const allPriorStepsDone = Boolean(isStep1Done && isStep2Done && isStep3Done);

  const isP2Done = Boolean(
    allPriorStepsDone && (
      project?.p2Complete === true ||
      project?.phase2Passed === true ||
      (project?.launchReadinessReport && project?.status === 'ready_for_phase3') ||
      project?.status === 'launched' ||
      projectCurrentPhase > 2
    )
  );

  const isStep4Done = isP2Done;

  const canAccessStep1 = true;
  const canAccessStep2 = isStep1Done;
  const canAccessStep3 = isStep1Done && isStep2Done;
  const canAccessStep4 = allPriorStepsDone;

  return {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isP2Done,
    allPriorStepsDone,
    canAccessStep1,
    canAccessStep2,
    canAccessStep3,
    canAccessStep4
  };
}

export function getPhase3StepGuards(project = {}, { strategy, telemetry, launchManager, launchReport, decisionNotice } = {}) {
  const strat = strategy || project?.launchStrategy || project?.phase3Strategy || {};
  const isLive = Boolean(project?.launchStatus === 'LIVE' || project?.isLive === true || strat?.productionLive === true);

  // Step 1: Prepare Launch
  const creatorTasks = strat.creatorChecklist || project?.launchStrategy?.creatorChecklist || [];
  const opsTasks = strat.opsChecklist || project?.launchStrategy?.opsChecklist || [];
  const hasTasks = creatorTasks.length > 0 && opsTasks.length > 0;
  const allTasksDone = hasTasks && creatorTasks.every(t => Boolean(t.done)) && opsTasks.every(t => Boolean(t.done));

  const isStep1Done = Boolean(
    strat?.strategyLocked === true ||
    strat?.approved === true ||
    project?.phase3Prepared === true ||
    allTasksDone
  );

  // Step 2: Launch + Monitor - Requires Step 1
  const telRev = telemetry?.revenue ?? project?.launchTelemetry?.revenue ?? 0;
  const telCust = telemetry?.customers ?? project?.launchTelemetry?.customers ?? 0;
  const isStep2Done = Boolean(
    isStep1Done && (
      (isLive && (telRev > 0 || telCust > 0 || project?.isLive === true)) ||
      (project?.launchStatus === 'LIVE') ||
      project?.step2Done === true ||
      project?.phase3Monitored === true
    )
  );

  // Step 3: AI Launch Manager - Requires Step 1 and Step 2
  const lm = launchManager || project?.launchManagerData;
  const dispatched = lm?.dispatchedActions || project?.dispatchedActions || [];
  const autoActions = lm?.automatedActions || [];
  const isStep3Done = Boolean(
    isStep1Done && isStep2Done && (
      project?.launchManagerDone === true ||
      project?.step3Done === true ||
      dispatched.length > 0 ||
      (autoActions.length > 0 && autoActions.every(a => dispatched.includes(a.id)))
    )
  );

  // Step 4: Launch Report + Decision - Requires Step 1, 2, and 3
  const allPriorStepsDone = Boolean(isStep1Done && isStep2Done && isStep3Done);
  const rep = launchReport || project?.launchReport;
  const dec = decisionNotice || project?.decisionNotice;

  const isStep4Done = Boolean(
    allPriorStepsDone && (
      Boolean(rep && (rep.score || 0) > 0 && dec) ||
      project?.phase3Complete === true
    )
  );

  const canAccessStep1 = true;
  const canAccessStep2 = isStep1Done;
  const canAccessStep3 = isStep1Done && isStep2Done;
  const canAccessStep4 = allPriorStepsDone;

  return {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    allPriorStepsDone,
    canAccessStep1,
    canAccessStep2,
    canAccessStep3,
    canAccessStep4
  };
}

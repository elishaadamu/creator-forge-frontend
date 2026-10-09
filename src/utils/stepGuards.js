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
    project.p1Complete === true ||
    project.phase1Passed === true ||
    project.planLocked === true ||
    project.phase1Step1Done === true ||
    project.validationPlan?.locked === true ||
    project.validationPlan?.approved === true ||
    project.validationPlan?.status === 'approved' ||
    project.validationPlan?.status === 'locked'
  );

  // Step 2: Build Validation Assets (Requires Step 1 to be done)
  const isStep2Done = Boolean(
    projectCurrentPhase > 1 ||
    project.p1Complete === true ||
    project.phase1Passed === true ||
    (isStep1Done && (
      project.assetsApproved === true ||
      project.phase1Step2Done === true ||
      project.landingPageApproved === true ||
      project.validationCampaign?.reviewStatus === 'approved' ||
      project.validationCampaign?.review_status === 'approved'
    ))
  );

  // Step 3: Creator Campaign (Requires Step 1 AND Step 2 to be done)
  const resolvedKit = project.campaignKit || project.validationCampaign?.campaign_kit || project.validationCampaign?.campaignKit;
  const isStep3Done = Boolean(
    projectCurrentPhase > 1 ||
    project.p1Complete === true ||
    project.phase1Passed === true ||
    (isStep1Done && isStep2Done && (
      project.campaignApproved === true ||
      project.phase1Step3Done === true ||
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
    project.p1Complete === true ||
    project.phase1Passed === true ||
    (isStep1Done && isStep2Done && isStep3Done && (
      project.validationOptimized === true ||
      project.telemetryReviewed === true ||
      project.phase1Step4Done === true
    ))
  );

  // Step 5: Validation Gate Checkpoint
  const allPriorStepsDone = Boolean(
    projectCurrentPhase > 1 ||
    project.p1Complete === true ||
    project.phase1Passed === true ||
    (isStep1Done && isStep2Done && isStep3Done && isStep4Done)
  );

  const isGatePassed = Boolean(
    projectCurrentPhase > 1 ||
    project.p1Complete === true ||
    project.phase1Passed === true ||
    (Array.isArray(project.gateDecisions) && project.gateDecisions.some(d => (d.decision === 'pass_to_phase2' || d.gateStatus === 'passed' || d.decision === 'pass') && d.phase !== 3)) ||
    (allPriorStepsDone && (
      project.phase1Step5Done === true ||
      (Array.isArray(project.gateDecisions) && project.gateDecisions.length > 0) ||
      (presaleGoal > 0 && currentPresales >= presaleGoal)
    ))
  );

  const isStep5Done = Boolean(isGatePassed || projectCurrentPhase > 1);

  // Step access unlock status (each step requires the preceding step to be completed)
  const canAccessStep1 = true;
  const canAccessStep2 = isStep1Done;
  const canAccessStep3 = isStep1Done && (isStep2Done || Boolean(project.landingPageApproved || project.assetsApproved));
  const canAccessStep4 = isStep1Done && isStep2Done && (isStep3Done || Boolean(resolvedKit));
  const canAccessStep5 = allPriorStepsDone || isStep4Done;

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
  const projectCurrentPhase = Number(project?.currentPhase || project?.current_phase || (project?.status === 'building' ? 2 : project?.status === 'launched' ? 3 : 1));

  // Step 1: Product + Build Plan
  const isStep1Done = Boolean(
    projectCurrentPhase > 2 ||
    project?.buildPlanApproved === true ||
    project?.mvpBuildPlan?.approved === true ||
    project?.mvpBuildPlan?.status === 'approved' ||
    project?.mvpBuildPlan?.locked === true ||
    project?.phase2Step1Done === true
  );

  // Step 2: Build MVP (Engineering Build) - Requires Step 1
  const isStep2Done = Boolean(
    projectCurrentPhase > 2 ||
    (isStep1Done && (
      (Array.isArray(tasks) && tasks.length > 0 && tasks.every(t => t.status === 'Completed' || t.status === 'done')) ||
      project?.buildCompleted === true ||
      project?.mvpBuildDone === true ||
      project?.phase2Step2Done === true
    ))
  );

  // Step 3: Beta Test - Requires Step 1 and Step 2
  const isStep3Done = Boolean(
    projectCurrentPhase > 2 ||
    (isStep1Done && isStep2Done && (
      project?.betaTestingCompleted === true ||
      project?.betaApproved === true ||
      project?.phase2BetaDone === true ||
      project?.phase2Step3Done === true ||
      (Array.isArray(clusters) && clusters.length > 0 && Array.isArray(project?.betaFeedback) && project.betaFeedback.some(f => f.approved || f.resolved))
    ))
  );

  // Step 4: Iterate + Launch Gate - Requires Step 1, 2, and 3
  const allPriorStepsDone = Boolean(isStep1Done && isStep2Done && isStep3Done);

  const isP2Done = Boolean(
    projectCurrentPhase > 2 ||
    project?.p2Complete === true ||
    project?.phase2Passed === true ||
    (allPriorStepsDone && (
      (project?.launchReadinessReport && project?.status === 'ready_for_phase3') ||
      Boolean(project?.readinessReport?.greenlight) ||
      project?.gateDecisions?.some(d => d.decision === 'pass_to_phase3' || d.decision === 'greenlight_launch')
    ))
  );

  const isStep4Done = isP2Done;

  const canAccessStep1 = true;
  const canAccessStep2 = Boolean(isStep1Done || plan?.productSpec || plan?.technicalPlan);
  const canAccessStep3 = Boolean(isStep2Done || isStep1Done);
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
    project?.phase3Step1Done === true ||
    allTasksDone
  );

  // Step 2: Launch + Monitor - Requires Step 1
  const isStep2Done = Boolean(
    isStep1Done && (
      project?.phase3Monitored === true ||
      project?.phase3Step2Done === true ||
      project?.phase3LaunchLive === true ||
      isLive
    )
  );

  // Step 3: AI Launch Manager - Requires Step 1 and Step 2
  const lm = launchManager || project?.launchManagerData;
  const dispatched = lm?.dispatchedActions || project?.dispatchedActions || [];
  const autoActions = lm?.automatedActions || [];
  const hasDiagnosticData = Boolean(
    lm && (
      lm.overallHealth ||
      lm.executiveSummary ||
      lm.diagnosis ||
      (Array.isArray(autoActions) && autoActions.length > 0)
    )
  );
  const isStep3Done = Boolean(
    isStep1Done && isStep2Done && (
      project?.launchManagerDone === true ||
      project?.phase3Step3Done === true ||
      dispatched.length > 0 ||
      hasDiagnosticData
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
  const canAccessStep2 = Boolean(isStep1Done || strat?.overview || project?.launchStrategy);
  const canAccessStep3 = Boolean(isStep2Done || isStep1Done || isLive);
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

export function getProjectActiveStep(project = {}, phase) {
  const currentPhase = Number(
    phase ||
    project.currentPhase ||
    project.current_phase ||
    (project.status === 'launched' || project.phase2Passed || project.p2Complete
      ? 3
      : project.status === 'building' || project.phase1Passed || project.p1Complete
      ? 2
      : project.gateDecisions?.some(d => d.decision === 'pass_to_phase3' || d.decision === 'launch_product')
      ? 3
      : project.gateDecisions?.some(d => d.decision === 'pass_to_phase2')
      ? 2
      : 1)
  );
  const dbStep = project.currentStep || project.current_step;

  if (currentPhase === 3) {
    const guards = getPhase3StepGuards(project);
    if (dbStep && ['prep', 'monitor', 'manager', 'report'].includes(dbStep)) {
      if (dbStep === 'report' && guards.canAccessStep4) return 'report';
      if (dbStep === 'manager' && guards.canAccessStep3) return 'manager';
      if (dbStep === 'monitor' && guards.canAccessStep2) return 'monitor';
      if (dbStep === 'prep') return 'prep';
    }
    if (!guards.isStep1Done) return 'prep';
    if (!guards.isStep2Done) return 'monitor';
    if (!guards.isStep3Done) return 'manager';
    return 'report';
  }
  if (currentPhase === 2) {
    const guards = getPhase2StepGuards(project);
    if (dbStep && ['plan', 'build', 'beta', 'gate'].includes(dbStep)) {
      if (dbStep === 'gate' && guards.canAccessStep4) return 'gate';
      if (dbStep === 'beta' && guards.canAccessStep3) return 'beta';
      if (dbStep === 'build' && guards.canAccessStep2) return 'build';
      if (dbStep === 'plan') return 'plan';
    }
    if (!guards.isStep1Done) return 'plan';
    if (!guards.isStep2Done) return 'build';
    if (!guards.isStep3Done) return 'beta';
    return 'gate';
  }
  // Phase 1
  const guards = getPhase1StepGuards(project);
  if (dbStep && ['plan', 'assets', 'campaign', 'optimize', 'gate'].includes(dbStep)) {
    if (dbStep === 'gate' && guards.canAccessStep5) return 'gate';
    if (dbStep === 'optimize' && guards.canAccessStep4) return 'optimize';
    if (dbStep === 'campaign' && guards.canAccessStep3) return 'campaign';
    if (dbStep === 'assets' && guards.canAccessStep2) return 'assets';
    if (dbStep === 'plan') return 'plan';
  }
  if (!guards.isStep1Done) return 'plan';
  if (!guards.isStep2Done) return 'assets';
  if (!guards.isStep3Done) return 'campaign';
  if (!guards.isStep4Done) return 'optimize';
  return 'gate';
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityPreferences } from "../ui/accessibility/AccessibilityPreferences";
import { AudioSettings } from "../ui/settings/AudioSettings";
import { TutorialCoach } from "../ui/onboarding/TutorialCoach";
import { NotificationCenter } from "../ui/notifications/NotificationCenter";
import { NotificationFilters } from "../ui/notifications/NotificationFilters";
import { ContextHelp } from "../ui/help/ContextHelp";
import { Drawer } from "../ui/shell/Drawer";
import { AudioEngine } from "../audio/audioEngine";
import { translateGame } from "../i18n";
import "../ui/accessibility/accessibility.css";
import "../ui/theme/theme.css";
import {
  shouldPauseForAlert,
  type NotificationRecord,
} from "../ui/notifications/notificationPreferences";
import { useGameStore } from "./gameStore";
import { WorkerRecoveryPanel } from "./WorkerRecoveryPanel";
import { SaveManager } from "../ui/SaveManager";
import { SaveTransferPanel } from "../ui/settings/SaveTransferPanel";
import { CITY } from "../game/content/1991/frankfurt";
import { STARTER_HOTEL } from "../game/content/1991/starterHotel";
import { getRate } from "../game/revenue/rates";
import { connectivityIndex } from "../game/transport/network";
import { TopBar } from "../ui/TopBar";
import { HotelView } from "../ui/HotelView";
import { RevenueDashboard } from "../ui/RevenueDashboard";
import {
  bookingsOnTheBooksRows,
  channelMixRows,
  competitionRows as revenueCompetitionRows,
  overbookingExposureRow,
  occupancyDriverRows,
  pickupRows,
  rateGridRows,
  ratePlanRows,
  revenueMetricsRow,
} from "../ui/revenueViewModel";
import { StaffDashboard } from "../ui/StaffDashboard";
import { workforceView } from "../ui/workforceView";
import {
  ManagedHotelSummary,
  ManagedHotelUnavailable,
} from "../ui/company/ManagedHotelSummary";
import { PurchasingDashboard } from "../ui/PurchasingDashboard";
import { FinanceDashboard } from "../ui/FinanceDashboard";
import { financeView } from "../ui/finance/financeView";
import { calculateCreditStanding } from "../game/finance/creditStanding";
import { reputationFor } from "../game/reputation/dimensions";
import { BuildPanel } from "../ui/BuildPanel";
import { FacilitiesDashboard } from "../ui/facilities/FacilitiesDashboard";
import { FnbDashboard } from "../ui/fnb/FnbDashboard";
import { CommercialSpacesPanel } from "../ui/facilities/CommercialSpacesPanel";
import { ClassificationPanel } from "../ui/facilities/ClassificationPanel";
import { STAFF_ROLES } from "../game/domain/staffRoles";
import { MonthlyCloseModal } from "../ui/MonthlyCloseModal";
import { CityDashboard } from "../ui/market/CityDashboard";
import { CompetitorTable } from "../ui/market/CompetitorTable";
import {
  cityActivityView,
  cityEconomyView,
  worldConditionsView,
} from "../ui/market/marketViewModel";
import {
  CityActivityPanel,
  CityEconomyPanel,
  WorldConditionsPanel,
} from "../ui/market/MarketPanels";
import { marketWageMinor } from "../game/labor/market";
import { BASE_MONTHLY_WAGE_MINOR } from "../game/content/1991/cityMarket";
import { REPORT_COST_MINOR } from "../game/marketResearch/forecast";
import {
  AREA_ORDER,
  ManagementShell,
  type ManagementAreaId,
} from "../ui/ManagementShell";
import { TechnologyPanel } from "../ui/TechnologyPanel";
import { WorldControls } from "../ui/WorldControls";
import {
  createCamera,
  focusCamera,
  followCamera,
  type CameraState,
} from "../render/camera";
import {
  focusKindForAlertTarget,
  rateByCategory,
  roomFocusPoint,
  visualAgents,
  worldProblems,
} from "../ui/hotelViewModel";
import { elevatorVisual } from "../render/agentMaterialization";
import { resolveEntityPosition } from "../render/sceneLayout";
import { monthlyContributionMinor } from "../game/facilities/commercialSpaces";
import { PortfolioDashboard } from "../ui/company/PortfolioDashboard";
import { BrandDashboard } from "../ui/company/BrandDashboard";
import { DevelopmentDashboard } from "../ui/company/DevelopmentDashboard";
import { ManagerGovernancePanel } from "../ui/company/ManagerGovernancePanel";
import { CommercialDashboard } from "../ui/company/CommercialDashboard";
import { GuestsDashboard } from "../ui/guests/GuestsDashboard";
import {
  audienceReachView,
  crmConsentView,
  salesPipelineView,
} from "../ui/company/marketingViewModel";
import {
  AudienceReachPanel,
  CrmConsentPanel,
  SalesPipelinePanel,
} from "../ui/company/MarketingPanels";
import {
  acquisitionsView,
  headquartersView,
  treasuryView,
} from "../ui/company/companyOperationsViewModel";
import {
  AcquisitionsPanel,
  HeadquartersPanel,
  TreasuryPanel,
} from "../ui/company/CompanyOperationsPanels";
import {
  complaintRows,
  guestReputationRows,
  loyaltyRows,
  receptionQueueRows,
  repeatGuestRows,
  reviewRows,
  satisfactionSummary,
} from "../ui/guests/guestsViewModel";
import { CampaignSetup } from "../ui/story/CampaignSetup";
import { StoryInbox } from "../ui/story/StoryInbox";
import { ChronicleView } from "../ui/story/ChronicleView";
import { MilestoneToast } from "../ui/story/MilestoneToast";
import { CareerOutcomeModal } from "../ui/story/CareerOutcomeModal";
import {
  brandAuditRows,
  brandRows,
  developmentRows,
  escalationRows,
  hotelName,
  managerRows,
  portfolioRows,
  accountRows,
  campaignRows,
  cityName,
  marketableGuestCount,
  reputationRows,
} from "../ui/company/companyViewModel";
import {
  BalancingDashboard,
  balancingMetricsFromSnapshot,
} from "../tools/balancing/BalancingDashboard";

function seedFromLocation(): number {
  if (typeof window === "undefined") return 424242;
  const raw = new URLSearchParams(window.location.search).get("seed");
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 424242;
}

function rendererDisabled(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("renderer") === "off"
  );
}

export function App() {
  const [seed] = useState(seedFromLocation);
  const game = useGameStore(seed);
  // Dismissal is tracked per closed month so February's report is not hidden
  // by January's "Continue".
  const [dismissedClose, setDismissedClose] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState<string | null>(null);
  const [openComplaintId, setOpenComplaintId] = useState<string | null>(null);
  /** Which house the group is currently looking at; the flagship by default. */
  const [openHotel, setOpenHotel] = useState<string | null>(null);
  /** Presentation state: where the player is looking, never a game rule. */
  const [camera, setCamera] = useState<CameraState>(createCamera);
  /** The milestone the toast has already announced; presentation only. */
  const [announcedMilestone, setAnnouncedMilestone] = useState<string | null>(
    null,
  );
  /**
   * Which desk drawer is open, if any. Chrome the player opens on purpose:
   * never more than one at a time, and never in front of the hotel by default.
   */
  const [openDrawer, setOpenDrawer] = useState<"settings" | "saves" | null>(
    null,
  );
  /** The noticeboard column, so the message button can put focus on it. */
  const messages = useRef<HTMLElement | null>(null);
  const preferences = game.preferences;
  const seenAlerts = useRef(new Set<string>());
  const audio = useRef<AudioEngine | null>(null);
  const audioPreferences = useRef(preferences.audio);
  const s = game.snapshot;
  const latestMilestone = s?.narrative.achievedMilestones.at(-1) ?? null;

  useEffect(() => {
    const enableAudio = () => {
      if (audio.current || typeof AudioContext === "undefined") return;
      audio.current = new AudioEngine(
        new AudioContext() as never,
        audioPreferences.current,
      );
      void audio.current.resume();
    };
    window.addEventListener("pointerdown", enableAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", enableAudio);
      if (audio.current) void audio.current.dispose();
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    audioPreferences.current = preferences.audio;
    audio.current?.apply(preferences.audio);
  }, [preferences.audio]);

  useEffect(() => {
    if (!s) return;
    for (const alert of s.alerts) {
      if (seenAlerts.current.has(alert.id)) continue;
      seenAlerts.current.add(alert.id);
      audio.current?.playCue(alert.severity === "critical" ? "warnings" : "ui");
      if (
        shouldPauseForAlert(
          alert.severity,
          preferences.notifications.autoPauseAt,
          alert.id,
          preferences.notifications.autoPauseTypes,
        )
      )
        game.requestPause();
    }
  }, [s, preferences.notifications, game]);

  useEffect(() => {
    const agentId = camera.followedAgentId;
    if (!s || !agentId) return;
    const agent = s.renderDescriptors.agents.find(
      (candidate) => candidate.id === agentId,
    );
    if (!agent) return;
    const position = resolveEntityPosition(
      s.renderDescriptors.positionByEntityId,
      agent.locationId,
    );
    if (!position) return;
    setCamera((current) => {
      if (
        current.followedAgentId !== agentId ||
        (current.x === position.x &&
          current.y === position.y &&
          current.floor === position.floor)
      )
        return current;
      return followCamera(current, {
        id: agentId,
        x: position.x,
        y: position.y,
        floor: position.floor,
      });
    });
  }, [s, camera.followedAgentId]);

  // The worker is the game: once it has stopped, the surface behind it is a
  // hotel frozen mid-day. Say so, and offer the newest trustworthy save.
  if (game.workerFailure)
    return (
      <main
        className="hm-root hm-boot"
        aria-label={translateGame(preferences.locale, "app.main")}
      >
        <WorkerRecoveryPanel
          message={game.workerFailure}
          onRecover={() => {
            void game.recoverFromWorkerFailure().then((recovered) => {
              // Nothing to go back to; a reload is the only way on.
              if (!recovered) window.location.reload();
            });
          }}
        />
      </main>
    );

  if (!s)
    return (
      <main
        className="hm-root hm-boot"
        aria-label={translateGame(preferences.locale, "app.main")}
      >
        <h1>Hotel Manager</h1>
        <p>Starting {CITY.name} 1991…</p>
      </main>
    );

  const cityWageMinor = marketWageMinor(
    BASE_MONTHLY_WAGE_MINOR,
    s.cityMarket.wagePressureBp,
  );
  const selectedHotelId = openHotel ?? s.hotel.id;
  const selectedHotel = portfolioRows(s).find(
    (hotel) => hotel.id === selectedHotelId,
  );
  const flagshipSelected = selectedHotelId === s.hotel.id;

  const singleRateMinor = getRate(
    s.rates,
    s.calendar.dateKey,
    "single",
    STARTER_HOTEL.defaultRateMinor.single,
  );

  const adoption = Object.fromEntries(
    s.world.technologies.map((technology) => [
      technology.id,
      technology.adoptionBp,
    ]),
  );

  const competitorTable = (
    <CompetitorTable
      rows={s.competitors}
      playerRateMinor={singleRateMinor}
      playerOccupancyBp={s.metrics.occupancyBasisPoints}
    />
  );

  const selectGuestRoom = (roomId: string) =>
    setCamera((current) =>
      focusCamera(current, {
        id: roomId,
        ...roomFocusPoint(roomId, s),
        kind: "room",
      }),
    );

  const openNotificationTarget = (entityId: string, alertId: string) => {
    setOpenAlert(alertId);
    const alert = s.alerts.find((candidate) => candidate.id === alertId);
    const target = alert?.target;
    const position = resolveEntityPosition(
      s.renderDescriptors.positionByEntityId,
      entityId,
    );
    if (!target || !position) return;
    setCamera((current) =>
      focusCamera(current, {
        id: entityId,
        x: position.x,
        y: position.y,
        floor: position.floor,
        kind: focusKindForAlertTarget(target.kind),
      }),
    );
  };
  const managedDepartmentFallback = selectedHotel ? (
    <ManagedHotelUnavailable
      hotelName={selectedHotel.name}
      level="department"
    />
  ) : null;

  const areaContent: Record<ManagementAreaId, ReactNode> = {
    mainView: (
      <>
        {!flagshipSelected && selectedHotel ? (
          <ManagedHotelUnavailable
            hotelName={selectedHotel.name}
            level="room"
          />
        ) : null}
        <HotelView
          rooms={flagshipSelected ? s.hotel.rooms : []}
          facilities={flagshipSelected ? s.facilities : []}
          agents={flagshipSelected ? visualAgents(s, camera) : []}
          floorByRoomId={
            flagshipSelected ? s.renderDescriptors.floorByRoomId : {}
          }
          positionByEntityId={
            flagshipSelected ? s.renderDescriptors.positionByEntityId : {}
          }
          floorPlan={
            flagshipSelected ? s.renderDescriptors.floorPlan : undefined
          }
          closedNavigationIds={
            flagshipSelected ? s.renderDescriptors.closedNavigationIds : []
          }
          elevator={flagshipSelected ? s.renderDescriptors.elevator : undefined}
          situations={
            flagshipSelected ? s.renderDescriptors.situations : undefined
          }
          camera={camera}
          minuteOfDay={s.calendar.minuteOfDay}
          focusedEntityId={camera.focusedId}
          occupantByRoomId={
            flagshipSelected ? s.renderDescriptors.occupantByRoomId : {}
          }
          rateByCategory={rateByCategory(s, STARTER_HOTEL.defaultRateMinor)}
          renovationPhaseByRoomId={
            flagshipSelected ? s.renderDescriptors.renovationPhaseByRoomId : {}
          }
          // Choosing a room anywhere moves the one camera the world uses,
          // so the register and the building never look at different places.
          onSelect={selectGuestRoom}
          onSelectAgent={(agentId) => {
            const agent = s.renderDescriptors.agents.find(
              (candidate) => candidate.id === agentId,
            );
            if (!agent) return;
            const position = resolveEntityPosition(
              s.renderDescriptors.positionByEntityId,
              agent.locationId,
            );
            if (!position) return;
            setCamera((current) =>
              focusCamera(current, {
                id: agentId,
                x: position.x,
                y: position.y,
                floor: position.floor,
                kind: "person",
              }),
            );
          }}
          onCamera={setCamera}
          disableRenderer={rendererDisabled()}
          locale={preferences.locale}
        />
        <WorldControls
          camera={camera}
          floors={
            flagshipSelected
              ? [
                  ...new Set(Object.values(s.renderDescriptors.floorByRoomId)),
                ].sort((a, b) => a - b)
              : []
          }
          minuteOfDay={s.calendar.minuteOfDay}
          elevator={
            flagshipSelected
              ? elevatorVisual(s.renderDescriptors.elevator)
              : {
                  queue: 0,
                  waitMinutes: 0,
                  cause: "world.elevatorCause.notSimulated",
                }
          }
          problems={flagshipSelected ? worldProblems(s) : []}
          onCamera={setCamera}
          locale={preferences.locale}
        />
      </>
    ),
    hotel: flagshipSelected ? (
      <>
        <FacilitiesDashboard rows={s.facilities} />
        <FnbDashboard fnb={s.fnb} locale={preferences.locale} />
        <CommercialSpacesPanel
          spaces={s.commercialSpaces.spaces.map((space) => ({
            id: space.id,
            kind: space.kind,
            capacity: space.capacity,
            openMinute: space.openMinute,
            closeMinute: space.closeMinute,
            operator: space.operator.kind,
            hotelShareMinor: monthlyContributionMinor(
              space,
              s.commercialSpaces.unitsSold[space.id] ?? 0,
            ).hotelShareMinor,
            unitsSold: s.commercialSpaces.unitsSold[space.id] ?? 0,
            fitBp: space.fitBp ?? (space.fit ?? 0) * 100,
          }))}
          lobby={s.lobby}
        />
        <ClassificationPanel
          classification={s.classification}
          specializationId={s.specializationId}
          investedArea={s.investedArea}
          onSetSpecialization={(specializationId) =>
            game.send({ type: "SET_SPECIALIZATION", specializationId })
          }
          onExpand={(area) => game.send({ type: "EXPAND_FACILITY", area })}
        />
        <BuildPanel
          renovationActive={s.renovation !== null}
          onStartRenovation={() => game.send({ type: "START_RENOVATION" })}
        />
        <TechnologyPanel
          technologies={s.world.technologies}
          projects={s.technologyProjects}
          implementations={s.technologyImplementations}
          onAdopt={(technologyId) =>
            game.send({ type: "ADOPT_TECHNOLOGY", technologyId })
          }
        />
      </>
    ) : selectedHotel ? (
      <ManagedHotelSummary hotel={selectedHotel} />
    ) : null,
    guests: flagshipSelected ? (
      <GuestsDashboard
        locale={preferences.locale}
        satisfaction={satisfactionSummary(s)}
        complaints={complaintRows(s)}
        reviews={reviewRows(s)}
        reception={receptionQueueRows(s)}
        loyalty={loyaltyRows(s)}
        repeatGuests={repeatGuestRows(s)}
        reputation={guestReputationRows(s)}
        openComplaintId={openComplaintId}
        onOpen={(id) =>
          setOpenComplaintId((current) => (current === id ? null : id))
        }
        onSelectRoom={selectGuestRoom}
      />
    ) : (
      managedDepartmentFallback
    ),
    staff: flagshipSelected ? (
      <StaffDashboard
        view={workforceView(s)}
        roles={STAFF_ROLES}
        marketWageMinor={cityWageMinor}
        locale={preferences.locale}
        onHire={(role) =>
          game.send({
            type: "HIRE",
            role,
            shift: "morning",
            // The house never offers under the going rate; a tight labour
            // market is paid for, not worked around.
            monthlyWageMinor: Math.max(250_000, cityWageMinor),
          })
        }
      />
    ) : (
      managedDepartmentFallback
    ),
    finance: flagshipSelected ? (
      <>
        <FinanceDashboard
          isPending={game.commandStatus === "pending"}
          locale={preferences.locale}
          view={financeView({
            finance: s.finance,
            statements: s.statements,
            loans: s.loans,
            loan: s.loan,
            insurance: s.insurance,
            lastMonthlyClose: s.lastMonthlyClose,
            renovation: s.renovation,
            company: {
              treasury: s.company.treasury,
              budgets: s.company.budgets,
            },
            hotelId: s.hotel.id,
            periodKey:
              s.lastMonthlyClose?.periodKey ?? s.calendar.dateKey.slice(0, 7),
          })}
          availableCollateralMinor={Math.max(
            0,
            (s.statements?.fixedAssetsMinor ??
              s.assets.reduce((sum, a) => sum + a.replacementMinor, 0)) -
              (s.loans ?? (s.loan ? [s.loan] : [])).reduce(
                (sum, l) => sum + l.collateralValueMinor,
                0,
              ),
          )}
          creditStandingInputs={{
            operatingCashFlowMinor:
              s.finance.month.roomRevenueMinor +
              s.finance.month.otherRevenueMinor -
              s.finance.month.operatingExpenseMinor,
            totalOutstandingMinor: (s.loans ?? (s.loan ? [s.loan] : [])).reduce(
              (sum, l) => sum + l.principalMinor,
              0,
            ),
            cashMinor: s.finance.cashMinor,
            equityMinor:
              (s.statements?.contributedCapitalMinor ?? 0) +
              (s.statements?.retainedEarningsMinor ?? 0),
            hotelCount: s.company.portfolio.hotelIds.length || 1,
            reputationScore: reputationFor(
              s.reputation,
              "group",
              s.company.companyId,
            ).score,
            totalCollateralValueMinor: (
              s.loans ?? (s.loan ? [s.loan] : [])
            ).reduce((sum, l) => sum + l.collateralValueMinor, 0),
            paymentHistory: s.finance.paymentHistory,
            macroInterestBp: s.world.macro.interestBp,
            creditSpreadMultiplierBp:
              s.narrative?.campaign?.inputs?.creditSpreadBasisPoints ?? 10_000,
          }}
          creditStanding={(() => {
            const standing = calculateCreditStanding({
              operatingCashFlowMinor:
                s.finance.month.roomRevenueMinor +
                s.finance.month.otherRevenueMinor -
                s.finance.month.operatingExpenseMinor,
              totalOutstandingMinor: (
                s.loans ?? (s.loan ? [s.loan] : [])
              ).reduce((sum, l) => sum + l.principalMinor, 0),
              cashMinor: s.finance.cashMinor,
              equityMinor:
                (s.statements?.contributedCapitalMinor ?? 0) +
                (s.statements?.retainedEarningsMinor ?? 0),
              hotelCount: s.company.portfolio.hotelIds.length || 1,
              reputationScore: reputationFor(
                s.reputation,
                "group",
                s.company.companyId,
              ).score,
              totalCollateralValueMinor: (
                s.loans ?? (s.loan ? [s.loan] : [])
              ).reduce((sum, l) => sum + l.collateralValueMinor, 0),
              paymentHistory: s.finance.paymentHistory,
              macroInterestBp: s.world.macro.interestBp,
              creditSpreadMultiplierBp:
                s.narrative?.campaign?.inputs?.creditSpreadBasisPoints ??
                10_000,
            });
            return {
              score: standing.score,
              offeredRateBp: standing.offeredRateBp,
              borrowingCapacityMinor: standing.borrowingLimitMinor,
            };
          })()}
          onTakeLoan={(params) => game.send({ type: "TAKE_LOAN", ...params })}
          onRepayLoan={(loanId, amountMinor) =>
            game.send({ type: "REPAY_LOAN", loanId, amountMinor })
          }
        />
        <PurchasingDashboard
          stock={s.stock}
          onOrder={(sku) =>
            game.send({ type: "ORDER_SUPPLIES", sku, quantity: 60 })
          }
        />
      </>
    ) : (
      managedDepartmentFallback
    ),
    revenue: flagshipSelected ? (
      <>
        <RevenueDashboard
          rates={rateGridRows(s)}
          bookings={bookingsOnTheBooksRows(s)}
          metrics={revenueMetricsRow(s)}
          channels={channelMixRows(s)}
          pickup={pickupRows(s)}
          ratePlans={ratePlanRows(s)}
          overbooking={overbookingExposureRow(s)}
          competition={revenueCompetitionRows(s)}
          occupancyDrivers={occupancyDriverRows(s)}
          locale={preferences.locale}
          onSetRate={(dateKey, category, rateMinor) =>
            game.send({
              type: "SET_RATE",
              dateKey,
              category,
              rateMinor,
            })
          }
          onSetRevenuePolicy={(change) =>
            game.send({ type: "SET_REVENUE_POLICY", change })
          }
          onSetGroupTargets={(targets) =>
            game.send({ type: "SET_GROUP_TARGETS", targets })
          }
        />
        {competitorTable}
      </>
    ) : (
      managedDepartmentFallback
    ),
    marketing: flagshipSelected ? (
      <>
        <SalesPipelinePanel
          view={salesPipelineView(s)}
          locale={preferences.locale}
        />
        <CrmConsentPanel view={crmConsentView(s)} locale={preferences.locale} />
        <AudienceReachPanel
          view={audienceReachView(s)}
          locale={preferences.locale}
        />
        <CommercialDashboard
          campaigns={campaignRows(s)}
          accounts={accountRows(s)}
          reputation={reputationRows(s)}
          loyaltyLiabilityMinor={s.commercial.loyalty.liabilityMinor}
          loyaltyMembers={s.commercial.loyalty.members.length}
          marketableGuests={marketableGuestCount(s)}
        />
      </>
    ) : (
      managedDepartmentFallback
    ),
    market: (
      <>
        <CityEconomyPanel
          view={cityEconomyView(s)}
          locale={preferences.locale}
        />
        <CityActivityPanel
          view={cityActivityView(s)}
          locale={preferences.locale}
        />
        <WorldConditionsPanel
          view={worldConditionsView(s)}
          locale={preferences.locale}
        />
        <CityDashboard
          business={s.cityMarket.demand.business}
          leisure={s.cityMarket.demand.leisure}
          event={s.cityMarket.demand.event}
          group={s.cityMarket.demand.group}
          low={s.cityMarket.forecast.low}
          high={s.cityMarket.forecast.high}
          connectivityIndex={connectivityIndex(s.cityMarket.transport)}
          informationQuality={s.cityMarket.informationQuality}
          researchCostMinor={REPORT_COST_MINOR}
          onBuyResearch={() => game.send({ type: "BUY_MARKET_RESEARCH" })}
        />
        {competitorTable}
      </>
    ),
    company: (
      <>
        <TreasuryPanel
          view={treasuryView(s)}
          locale={preferences.locale}
          onTransfer={(hotelId, amountMinor, direction) =>
            game.send({
              type: "TRANSFER_INTERNAL_FUNDING",
              hotelId,
              amountMinor,
              direction,
            })
          }
        />
        <AcquisitionsPanel
          view={acquisitionsView(s)}
          locale={preferences.locale}
          onDiligence={(targetId, areas) =>
            game.send({ type: "RUN_DUE_DILIGENCE", targetId, areas })
          }
          onAcquire={(targetId, priceMinor) =>
            game.send({ type: "ACQUIRE_HOTEL", targetId, priceMinor })
          }
        />
        <HeadquartersPanel
          view={headquartersView(s)}
          locale={preferences.locale}
        />
        <PortfolioDashboard
          hotels={portfolioRows(s)}
          onOpenHotel={setOpenHotel}
        />
        <p aria-label="Selected hotel">
          Viewing: {hotelName(s, selectedHotelId)}
        </p>
        <BrandDashboard
          brands={brandRows(s)}
          audits={brandAuditRows(s)}
          hotels={portfolioRows(s).map((h) => ({ id: h.id, name: h.name }))}
          onAssignBrand={(hotelId, brandId) =>
            game.send({ type: "ASSIGN_BRAND", hotelId, brandId })
          }
        />
        <DevelopmentDashboard
          developments={developmentRows(s)}
          onCompleteTask={(developmentId, item) =>
            game.send({
              type: "COMPLETE_PRE_OPENING_TASK",
              developmentId,
              item,
            })
          }
          onOpen={(developmentId) =>
            game.send({ type: "OPEN_DEVELOPMENT", developmentId })
          }
        />
        <ManagerGovernancePanel
          managers={managerRows(s)}
          escalations={escalationRows(s)}
          onSetRepairLimit={(hotelId, repairLimitMinor) =>
            game.send({
              type: "SET_MANAGER_AUTHORITY",
              hotelId,
              authority: { repairLimitMinor },
            })
          }
          onResolve={(escalationId, approve) =>
            game.send({ type: "RESOLVE_ESCALATION", escalationId, approve })
          }
        />
      </>
    ),
    campaign: (
      <>
        <CampaignSetup
          difficulty={s.narrative.campaign.difficulty}
          sandbox={s.narrative.campaign.sandbox}
          locked={s.elapsedMinutes > 0}
          onDifficulty={(difficulty) =>
            game.send({ type: "SET_CAMPAIGN_DIFFICULTY", difficulty })
          }
          onSandbox={(sandbox) =>
            game.send({ type: "SET_CAMPAIGN_SANDBOX", sandbox })
          }
        />
        <StoryInbox
          events={s.narrative.activeEvents.map((event) => ({
            id: event.id,
            titleKey: `${event.definitionId}.title`,
            bodyKey: `${event.definitionId}.body`,
            raisedDateKey: event.triggeredDateKey,
            choices: event.choices.map((choice) => ({
              id: choice.id,
              labelKey: choice.labelKey,
            })),
          }))}
          onChoose={(eventId, choiceId) =>
            game.send({ type: "RESOLVE_NARRATIVE_EVENT", eventId, choiceId })
          }
        />
        <ChronicleView
          entries={s.narrative.chronicle.map((entry) => ({
            id: entry.id,
            date: entry.date,
            text: entry.textKey,
            scope: entry.scope,
          }))}
        />
      </>
    ),
  };

  return (
    <div
      lang={preferences.locale.slice(0, 2)}
      className={`hm-root${preferences.accessibility.highContrast ? " high-contrast" : ""}`}
      style={{ fontSize: `${preferences.accessibility.textScale}rem` }}
      data-reduced-motion={preferences.accessibility.reducedMotion}
    >
      <TopBar
        hotelName={s.hotel.name}
        city={CITY.name}
        dateKey={s.calendar.dateKey}
        minuteOfDay={s.calendar.minuteOfDay}
        cashMinor={s.finance.cashMinor}
        monthProfitMinor={
          s.finance.month.roomRevenueMinor +
          s.finance.month.otherRevenueMinor -
          s.finance.month.operatingExpenseMinor
        }
        occupancyBasisPoints={s.metrics.occupancyBasisPoints}
        reputation={s.guestSatisfaction.score}
        warningCount={s.alerts.length}
        speed={game.speed}
        onSpeed={game.setSpeed}
        onSave={() => game.save()}
        onLoad={() => game.load()}
        onOpenSettings={() => setOpenDrawer("settings")}
        onOpenSaves={() => setOpenDrawer("saves")}
        onOpenNotifications={() => messages.current?.focus()}
        locale={preferences.locale}
      />
      {/*
        The frame: departments on the left, the department the player opened in
        the middle, the noticeboard on the right. Everything else in this file
        is a drawer or a modal, so this is the whole game on one screen.
      */}
      <div className="hm-frame">
        <ManagementShell
          locale={preferences.locale}
          title={translateGame(preferences.locale, "app.main")}
          adoption={{
            personalComputerBp: adoption["personal-computer"] ?? 0,
            internetBp: adoption.internet ?? 0,
            smartphoneBp: adoption.smartphone ?? 0,
            channelManagerBp: adoption["channel-manager"] ?? 0,
          }}
          areas={AREA_ORDER.map((id) => ({ id, content: areaContent[id] }))}
        />
        {/*
          The noticeboard, in reading order: what to do next, what has just
          happened, and why the house stands where it does.
        */}
        <aside
          className="hm-messages"
          ref={messages}
          tabIndex={-1}
          aria-label={translateGame(preferences.locale, "notifications.board")}
        >
          {preferences.tutorialCompleted.length < 3 ? (
            <TutorialCoach
              state={{
                step:
                  preferences.tutorialCompleted.length === 0
                    ? "set-room-price"
                    : preferences.tutorialCompleted.at(-1) === "set-room-price"
                      ? "inspect-bookings"
                      : "hire-housekeeping",
                completed: preferences.tutorialCompleted,
              }}
              onDismiss={() =>
                game.setPreferences({
                  ...preferences,
                  tutorialCompleted: [
                    "set-room-price",
                    "inspect-bookings",
                    "hire-housekeeping",
                  ],
                })
              }
              onAction={game.observeTutorialAction}
              locale={preferences.locale}
            />
          ) : null}
          <NotificationCenter
            notifications={s.alerts.map((alert): NotificationRecord => ({
              id: alert.id,
              type: alert.id,
              category: alert.category,
              severity: alert.severity,
              gameTime: alert.gameTime,
              source: alert.source,
              causes: [{ key: alert.cause, values: alert.causeValues }],
              read: openAlert === alert.id,
              acknowledged: alert.acknowledged,
              groupId: alert.groupId,
              delegate: alert.delegate,
              message: { key: alert.title, values: alert.causeValues },
              actionTarget: alert.actionEntityId
                ? {
                    label: {
                      key: "notifications.open",
                      values: {
                        title: translateGame(
                          preferences.locale,
                          alert.title,
                          alert.causeValues,
                        ),
                      },
                    },
                    entityId: alert.target?.entityId ?? alert.actionEntityId,
                  }
                : undefined,
            }))}
            preferences={preferences.notifications}
            pauseState={game.pauseStatus}
            onAction={openNotificationTarget}
            onAcknowledge={game.acknowledgeAlert}
            locale={preferences.locale}
          />
          {/* Which messages reach the board is a setting about the board, so
              it is folded away underneath it rather than filling a screen. */}
          <details className="hm-messages__filters">
            <summary>
              {translateGame(preferences.locale, "notifications.filtersToggle")}
            </summary>
            <NotificationFilters
              value={preferences.notifications}
              locale={preferences.locale}
              categories={[...new Set(s.alerts.map((alert) => alert.category))]}
              hotels={s.company.portfolio.hotelIds.map((id) => ({
                id,
                name: hotelName(s, id),
              }))}
              regions={[
                ...new Set(Object.values(s.company.portfolio.hotelRegion)),
              ].map((id) => {
                const hotelId = s.company.portfolio.hotelIds.find(
                  (candidate) =>
                    s.company.portfolio.hotelRegion[candidate] === id,
                );
                return { id, name: hotelId ? cityName(s, hotelId) : id };
              })}
              onChange={(notifications) =>
                game.setPreferences({ ...preferences, notifications })
              }
            />
          </details>
          <ContextHelp
            title={translateGame(preferences.locale, "help.guestSatisfaction")}
            drivers={s.guestSatisfaction.causes.map((key) => ({ key }))}
            locale={preferences.locale}
          />
        </aside>
      </div>
      {/* Diagnostics, at the size a diagnostic deserves: three live regions
          the player may consult and is never interrupted by. */}
      <div className="hm-telemetry">
        <p
          className="hm-telemetry__status"
          role="status"
          aria-label="Simulation status"
          aria-live="polite"
        >
          {game.errors.length > 0 ? game.errors[game.errors.length - 1] : ""}
        </p>
        <p aria-label="Command status" aria-live="polite">
          {translateGame(preferences.locale, "app.telemetry.command", {
            status: game.commandStatus,
          })}
        </p>
        <p aria-label="Saves committed">
          {translateGame(preferences.locale, "app.telemetry.saves", {
            count: game.savedCount,
          })}
        </p>
      </div>
      <Drawer
        id="hm-drawer-saves"
        title={translateGame(preferences.locale, "topbar.openSaves")}
        open={openDrawer === "saves"}
        onClose={() => setOpenDrawer(null)}
        locale={preferences.locale}
      >
        <SaveManager
          slots={game.slots}
          recoveredFrom={game.recoveredFrom}
          validationFailure={game.validationFailure}
          onSave={(slot) => game.save(slot)}
          onLoad={(slot) => game.load(slot)}
        />
        <SaveTransferPanel />
      </Drawer>
      <Drawer
        id="hm-drawer-settings"
        title={translateGame(preferences.locale, "topbar.openSettings")}
        open={openDrawer === "settings"}
        onClose={() => setOpenDrawer(null)}
        locale={preferences.locale}
      >
        <section
          aria-label={translateGame(
            preferences.locale,
            "settings.presentation",
          )}
        >
          <label>
            {translateGame(preferences.locale, "topbar.language")}{" "}
            <select
              aria-label={translateGame(preferences.locale, "topbar.language")}
              value={preferences.locale}
              onChange={(event) => {
                const locale = event.currentTarget.value as "de-DE" | "en-GB";
                game.setPreferences({ ...preferences, locale });
              }}
            >
              <option value="de-DE">Deutsch</option>
              <option value="en-GB">English</option>
            </select>
          </label>
          <AccessibilityPreferences
            value={preferences.accessibility}
            locale={preferences.locale}
            onChange={(accessibility) =>
              game.setPreferences({ ...preferences, accessibility })
            }
          />
          <AudioSettings
            value={preferences.audio}
            locale={preferences.locale}
            onChange={(audio) => game.setPreferences({ ...preferences, audio })}
          />
        </section>
      </Drawer>
      {new URLSearchParams(window.location.search).get("balancing") === "on" ? (
        <BalancingDashboard metrics={balancingMetricsFromSnapshot(s)} />
      ) : null}
      <MonthlyCloseModal
        locale={preferences.locale}
        report={
          s.lastMonthlyClose && s.lastMonthlyClose.periodKey !== dismissedClose
            ? s.lastMonthlyClose
            : null
        }
        onDismiss={() =>
          setDismissedClose(s.lastMonthlyClose?.periodKey ?? null)
        }
      />
      <MilestoneToast
        milestoneId={
          latestMilestone !== announcedMilestone ? latestMilestone : null
        }
        onDismiss={() => setAnnouncedMilestone(latestMilestone)}
      />
      <CareerOutcomeModal
        outcome={s.narrative.career}
        onRecovery={(path) =>
          game.send({ type: "TAKE_RECOVERY_MEASURE", path })
        }
        onContinue={() => game.send({ type: "CONTINUE_ENDLESS_CAREER" })}
        onRestart={() => game.restart()}
      />
    </div>
  );
}


import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { ControlScheme, Difficulty } from '../../types';
import type { Screen, Ability, Tank as TankType, Projectile as ProjectileType, Wall, Vector, Animation, PowerUp, Boss, Telegraph, Settings, EffectZone, StatusEffect, PowerUpType, AbilityId, DamageNumber, DamageIndicator, Minion, PoisonStatusEffect, StunStatusEffect } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';

import HUD from './HUD';
import AbilityHotbar from './AbilityHotbar';
import { drawTank, drawProjectile, drawWall, drawGrid, drawAnimations, drawPowerUp, drawCyberBeam, drawBarrageReticle, drawChronoReticle, drawBarrageWarning, drawBoss, drawTelegraphs, drawEffectZones, drawTimeStopOverlay, drawDamageNumbers, drawDamageIndicators, drawMinion, drawChronoShards } from './canvasRenderer';
import { findPath, createNavGrid, hasLineOfSight, smoothPath, lineIntersectsRect } from './pathfinding';
import Leaderboard from './Leaderboard';
import { generateUsername } from './usernameGenerator';
import CustomCursor from './CustomCursor';
import { SettingsIcon } from '../../constants';
import BossHealthBar from './BossHealthBar';

// Game Constants
const ARENA_WIDTH = 1000;
const ARENA_HEIGHT = 700;
const TANK_WIDTH = 40;
const TANK_HEIGHT = 50;
const BARREL_LENGTH = TANK_HEIGHT / 1.6; // Sync with renderer
const PLAYER_SPEED = 1.75;
const TANK_HEALTH = 8;
const PROJECTILE_SPEED = 3;
const PROJECTILE_SIZE = 8;
const FIRE_COOLDOWN = 425; // ms for player
const PATHFINDING_CELL_SIZE = 20;
const STUCK_THRESHOLD = 0.5; // pixels moved to be considered not stuck
const STUCK_TIME = 500; // ms to check for movement
const KILL_SCORE = 75;
const RESPAWN_DELAY = 3000; // ms for AI

// Boss Constants
const BOSS_SPAWN_SCORE = 350;
const BOSS_HEALTH = 100;
const BOSS_WIDTH = TANK_WIDTH * 3.0; // Increased size
const BOSS_HEIGHT = TANK_HEIGHT * 3.0; // Increased size
const BOSS_SPEED = 0.5;
const BOSS_IDLE_TIME = 3000; // Time between attacks
const MORTAR_TELEGRAPH_DURATION = 2000;
const MORTAR_ATTACK_DURATION = 500; // Time the strike is active
const MORTAR_STRIKE_COUNT = 5;
const MORTAR_RADIUS = 40;
const MORTAR_DAMAGE = 1.5;
const LASER_TELEGRAPH_DURATION = 1500;
const LASER_ATTACK_DURATION = 3000;
const LASER_WIDTH = 800;
const LASER_THICKNESS = 60;
const LASER_DAMAGE_PER_TICK = 0.15; // Damage is now tangible
const LASER_DAMAGE_TICK_INTERVAL = 100; // ms between damage ticks
const MULTI_LANE_TELEGRAPH = 1800;
const MULTI_LANE_ATTACK_DURATION = 500;
const MULTI_LANE_DAMAGE = 1.2;
const XPATT_TELEGRAPH = 1500;
const XPATT_ATTACK_DURATION = 500;
const XPATT_DAMAGE = 1.5;
const BOSS_TURRET_TURN_SPEED = 2.5;
const LAST_STAND_HEALTH_THRESHOLD = 0.15; // 15% HP
const LAST_STAND_TELEGRAPH_DURATION = 6500;
const LAST_STAND_RADIUS = 500;
const LAST_STAND_ATTACK_DURATION = 2500;
const MINION_SUMMON_TELEGRAPH = 2000;
const MINION_SUMMON_COUNT = 4; // Increased count to form a better arc

// Minion Constants
const MINION_HEALTH = 4;
const MINION_SPAWN_DURATION = 1500;
const MINION_FIRE_COOLDOWN = 2500;
const MINION_PROJECTILE_SPEED = 2.5;
const MINION_PROJECTILE_DAMAGE = 0.5;
const MINION_SIZE = { width: 40, height: 40 };
const MINION_KILL_SCORE = 25;

// Abilities
const BARRAGE_RADIUS = 100; const BARRAGE_AIM_SLOW_FACTOR = 0.4; const BARRAGE_WARNING_DURATION = 1500; const BARRAGE_STRIKE_DURATION = 2000; const BARRAGE_COOLDOWN = 20000; const BARRAGE_DAMAGE_PER_TICK = 0.05; const BARRAGE_IMPACT_INTERVAL = 75;
const CYBER_BEAM_CHARGE_TIME = 4000; const CYBER_BEAM_ACTIVE_DURATION = 14000; const CYBER_BEAM_COOLDOWN = 20000; const CYBER_BEAM_DAMAGE_INTERVAL = 50; const CYBER_BEAM_DAMAGE = 0.30; const CYBER_BEAM_INTERPOLATION_FACTOR = 0.1;
const OVERDRIVE_DURATION = 8000; const OVERDRIVE_COOLDOWN = 20000; const OVERDRIVE_SPEED_MULTIPLIER = 1.6; const OVERDRIVE_FIRE_RATE_MULTIPLIER = 0.5;
const CHRONO_BUBBLE_RADIUS = 120; const CHRONO_BUBBLE_DURATION = 8000; const CHRONO_BUBBLE_COOLDOWN = 25000; const CHRONO_BUBBLE_SLOW_FACTOR = 0.3;
const TOXIC_ROUNDS_DURATION = 12000; const TOXIC_ROUNDS_COOLDOWN = 25000; const POISON_TICK_DAMAGE = 0.02; const POISON_TICK_INTERVAL = 500; const POISON_STACK_DURATION = 5000;
const TIME_STOP_CHARGE_DURATION = 2000; const TIME_STOP_DURATION = 5000; const TIME_STOP_COOLDOWN = 20000;
const CHRONO_SHARD_SPAWN_INTERVAL = 120;
const CHRONO_SHARD_DAMAGE = 2.0;
const CHRONO_SHARD_STAGGER_DURATION = 1500;

// Mastered Abilities
const MASTERED_OVERDRIVE_DURATION = 12000;
const MASTERED_OVERDRIVE_COOLDOWN = 15000;
const MASTERED_OVERDRIVE_FIRE_RATE_MULTIPLIER = 0.35;
const MASTERED_OVERDRIVE_DAMAGE_BONUS = 0.25;
const OVERDRIVE_MASTERY_KILLS = 10;

// Power-ups
const POWERUP_SPAWN_INTERVAL = 8000; const MAX_POWERUPS = 3; const POWERUP_SIZE = 30;
const DUAL_CANNON_DURATION = 10000; const SHIELD_HEALTH = 3;
const REGENSULE_DURATION = 15000; const REGENSULE_HEALTH_BONUS = 1; const REGENSULE_REGEN_RATE = 0.1; const REGENSULE_REGEN_INTERVAL = 500;
const REFLECTOR_FIELD_DURATION = 10000;
const LIFE_LEECH_DURATION = 15000; const LIFE_LEECH_AMOUNT = 0.1;
const HOMING_MISSILE_COUNT = 8; const HOMING_MISSILE_SPEED = 3.0; const HOMING_MISSILE_TURN_RATE = 5; const HOMING_MISSILE_AOE_RADIUS = 40; const HOMING_MISSILE_DIRECT_DAMAGE = 1.5; const HOMING_MISSILE_AOE_DAMAGE = 0.75;

// Animations
const SPAWN_DURATION = 1000; const SPAWN_INVULNERABILITY = 1500; const DEATH_DURATION = 500; const HIT_FLASH_DURATION = 150; const MUZZLE_FLASH_DURATION = 100; const HIT_ANIMATION_DURATION = 200; const BARRAGE_IMPACT_DURATION = 400; const HOMING_EXPLOSION_DURATION = 500;

interface GameState {
  player: TankType;
  enemies: TankType[];
  projectiles: ProjectileType[];
  animations: Animation[];
  powerUps: PowerUp[];
  abilities: Ability[];
  isAiming: AbilityId | null;
  barrageTarget: (Vector & { isChronoBoosted?: boolean }) | null;
  barrageStrikeStartTime: number | null;
  lastBarrageImpactTime: number;
  cyberBeamTarget: Vector | null;
  boss: Boss | null;
  minions: Minion[];
  telegraphs: Telegraph[];
  effectZones: EffectZone[];
  masteryNotification: { text: string; startTime: number } | null;
  isTimeStopped: boolean;
  damageNumbers: DamageNumber[];
  damageIndicators: DamageIndicator[];
  chronoShards: { position: Vector, angle: number, createdAt: number }[];
}

const initialWalls: Wall[] = [
    { id: 'wall1', x: 200, y: 200, width: 150, height: 30 },
    { id: 'wall2', x: ARENA_WIDTH - 350, y: 200, width: 150, height: 30 },
    { id: 'wall3', x: ARENA_WIDTH / 2 - 15, y: 350, width: 30, height: 150 },
];

const getInitialPlayerState = (spawnTime: number): TankType => ({
  id: 'player', name: 'Player_One', type: 'player', status: 'spawning', spawnTime,
  position: { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 100 }, velocity: { x: 0, y: 0 },
  angle: 0, turretAngle: 0, size: { width: TANK_WIDTH, height: TANK_HEIGHT },
  health: TANK_HEALTH, maxHealth: TANK_HEALTH, color: '#00E0FF', score: 0, kills: 0, deaths: 0,
});

const getInitialEnemyState = (id: string, name: string, position: Vector, spawnTime: number, tier: 'basic' | 'intermediate'): TankType => ({
  id, name, type: 'enemy', status: 'spawning', spawnTime, position, tier,
  velocity: { x: 0, y: 0 }, angle: 180, turretAngle: 180, size: { width: TANK_WIDTH, height: TANK_HEIGHT },
  health: TANK_HEALTH, maxHealth: TANK_HEALTH,
  color: tier === 'intermediate' ? '#f97316' : '#F000B8', 
  score: 0, kills: 0, deaths: 0,
});

const getInitialMinionState = (id: string, position: Vector, spawnTime: number): Minion => ({
  id,
  position,
  angle: 180,
  health: MINION_HEALTH,
  maxHealth: MINION_HEALTH,
  status: 'spawning',
  spawnTime,
  lastFireTime: 0,
});

const getInitialEnemies = (spawnTime: number): TankType[] => [
  getInitialEnemyState('enemy1', generateUsername(), { x: 100, y: 100 }, spawnTime, 'basic'),
  getInitialEnemyState('enemy2', generateUsername(), { x: ARENA_WIDTH - 100, y: 100 }, spawnTime, 'basic'),
  getInitialEnemyState('enemy3', generateUsername(), { x: ARENA_WIDTH / 2, y: 150 }, spawnTime, 'basic'),
];

const getInitialGameState = (): GameState => {
    const now = Date.now();
    return {
        player: getInitialPlayerState(now),
        enemies: getInitialEnemies(now),
        projectiles: [], animations: [], powerUps: [], minions: [],
        abilities: [
             { id: 'overdrive', name: 'Overdrive', keyBinding: 'Q', state: 'ready', duration: OVERDRIVE_DURATION, cooldown: OVERDRIVE_COOLDOWN, startTime: 0, mastered: false },
             { id: 'cyberBeam', name: 'Cyber Beam', keyBinding: 'E', state: 'ready', duration: CYBER_BEAM_ACTIVE_DURATION, cooldown: CYBER_BEAM_COOLDOWN, startTime: 0, },
             { id: 'chronoBubble', name: 'Chrono Bubble', keyBinding: 'F', state: 'ready', duration: CHRONO_BUBBLE_DURATION, cooldown: CHRONO_BUBBLE_COOLDOWN, startTime: 0 },
             { id: 'barrage', name: 'Barrage', keyBinding: 'G', state: 'ready', duration: BARRAGE_STRIKE_DURATION + BARRAGE_WARNING_DURATION, cooldown: BARRAGE_COOLDOWN, startTime: 0, },
             { id: 'toxicRounds', name: 'Toxic Rounds', keyBinding: 'R', state: 'ready', duration: TOXIC_ROUNDS_DURATION, cooldown: TOXIC_ROUNDS_COOLDOWN, startTime: 0, },
             { id: 'timeStop', name: 'Time Stop', keyBinding: 'Y', state: 'ready', duration: TIME_STOP_DURATION, cooldown: TIME_STOP_COOLDOWN, startTime: 0, chargeDuration: TIME_STOP_CHARGE_DURATION, chargeStartTime: 0 },
        ],
        isAiming: null, barrageTarget: null, barrageStrikeStartTime: null, lastBarrageImpactTime: 0,
        cyberBeamTarget: null, boss: null, telegraphs: [], effectZones: [],
        masteryNotification: null, isTimeStopped: false,
        damageNumbers: [], damageIndicators: [],
        chronoShards: [],
    };
};

class GameManager {
    state: GameState;
    gamePhase: 'pre-boss' | 'boss' | 'post-boss' = 'pre-boss';
    keysPressed: Record<string, boolean> = {};
    mousePosition: Vector = { x: 0, y: 0 };
    lastFireTime: Record<string, number> = { player: 0 };
    lastPathRecalc: Record<string, number> = {};
    lastPosition: Record<string, {pos: Vector, time: number}> = {};
    playerHistory: {pos: Vector, time: number}[] = [];
    lastPowerUpSpawnTime: number = 0;
    beamChargeTimeoutRef: ReturnType<typeof setTimeout> | null = null;
    lastCyberBeamDamageTime: Record<string, number> = {};
    lastCyberBeamPoisonTime: Record<string, number> = {};
    lastRegenTime: number = 0;
    lastLaserDamageTime: number = 0;
    navGrid: number[][];
    lastChronoShardTime: number = 0;

    settings: Settings;
    difficultyParams: any;
    audioManager: any;

    private setState: (updater: (prevState: GameState) => GameState) => void;
    private triggerShake: (intensity: number, duration: number) => void;
    private playPooledSound: (key: 'shot') => void;
    private controlSound: (audio: HTMLAudioElement | undefined, action: 'play' | 'stop') => void;
    private playSound: (audio: HTMLAudioElement | undefined) => void;

    constructor(
        settings: Settings, difficultyParams: any, audioManager: any,
        setState: (updater: (prevState: GameState) => GameState) => void,
        triggerShake: (intensity: number, duration: number) => void,
        playPooledSound: (key: 'shot') => void,
        controlSound: (audio: HTMLAudioElement | undefined, action: 'play' | 'stop') => void,
        playSound: (audio: HTMLAudioElement | undefined) => void
    ) {
        this.settings = settings; this.difficultyParams = difficultyParams;
        this.audioManager = audioManager; this.setState = setState;
        this.triggerShake = triggerShake; this.playPooledSound = playPooledSound;
        this.controlSound = controlSound; this.playSound = playSound;
        this.state = getInitialGameState();
        this.navGrid = createNavGrid(ARENA_WIDTH, ARENA_HEIGHT, PATHFINDING_CELL_SIZE, initialWalls, TANK_WIDTH, TANK_HEIGHT);
        this.lastLaserDamageTime = 0;
    }
    
    private checkCollision = (rect1: any, rect2: any) => rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
    private isCollidingWithEnvironment = (rect: {x: number, y: number, width: number, height: number}, tanksToAvoid: (TankType | Boss | Minion)[]) => {
        if (rect.x < 0 || rect.x + rect.width > ARENA_WIDTH || rect.y < 0 || rect.y + rect.height > ARENA_HEIGHT) return true;
        if (initialWalls.some(wall => this.checkCollision(rect, wall))) return true;
        if (tanksToAvoid.some(tank => this.checkCollision(rect, { x: tank.position.x - ('size' in tank ? tank.size.width : MINION_SIZE.width)/2, y: tank.position.y - ('size' in tank ? tank.size.height : MINION_SIZE.height)/2, width: ('size' in tank ? tank.size.width : MINION_SIZE.width), height: ('size' in tank ? tank.size.height : MINION_SIZE.height) }))) return true;
        return false;
    };
    private findSafeSpawnPoint = (tanksToAvoid: (TankType|Boss|Minion)[], size = {w: TANK_WIDTH, h: TANK_HEIGHT}): Vector => {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * (ARENA_WIDTH - size.w * 2) + size.w;
            const y = Math.random() * (ARENA_HEIGHT - size.h * 2) + size.h;
            const spawnRect = { x: x - size.w / 2, y: y - size.h / 2, width: size.w, height: size.h };
            if (!this.isCollidingWithEnvironment(spawnRect, tanksToAvoid.filter(t => t && (t.status === 'active' || t.status === 'spawning')))) {
                return { x, y };
            }
        }
        return { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2};
    };
    private applyPoison = (target: TankType | Boss | Minion, stacks: number, now: number) => {
        if (!target.statusEffects) target.statusEffects = [];
        let poison = target.statusEffects.find(e => e.type === 'poison') as PoisonStatusEffect | undefined;
        if (poison) {
            poison.stacks = Math.min(5, poison.stacks + stacks); // Cap stacks at 5
            poison.lastApplied = now;
        } else {
            const newPoison: PoisonStatusEffect = { type: 'poison', ownerId: 'player', stacks, lastApplied: now, duration: POISON_STACK_DURATION, tickDamage: POISON_TICK_DAMAGE, tickInterval: POISON_TICK_INTERVAL, lastTickTime: now };
            target.statusEffects.push(newPoison);
        }
    };
    private applyStun = (target: TankType | Boss | Minion, duration: number, now: number) => {
        if (!target.statusEffects) target.statusEffects = [];
        // Remove existing stun to reset it
        target.statusEffects = target.statusEffects.filter(e => e.type !== 'stun');
        const stunEffect: StunStatusEffect = {
            type: 'stun',
            ownerId: 'player',
            startTime: now,
            duration: duration
        };
        target.statusEffects.push(stunEffect);
    };

    handleKeyDown(key: string) {
        this.keysPressed[key] = true;
        const now = Date.now();
        // FIX: Added 'as const' to string literals for ability states to prevent TypeScript from widening the type to 'string', which caused type errors in setState.
        this.setState(prev => {
            let abilities = prev.abilities;
            let isAiming: AbilityId | null = prev.isAiming;
            
            const abilityMap: { [key: string]: AbilityId } = { q: 'overdrive', e: 'cyberBeam', f: 'chronoBubble', g: 'barrage', r: 'toxicRounds', y: 'timeStop' };
            const abilityId = abilityMap[key];

            if (abilityId) {
                const ability = abilities.find(a => a.id === abilityId);
                if (ability && ability.state === 'ready' && prev.player.status === 'active') {
                    if (abilityId === 'chronoBubble' || abilityId === 'barrage') {
                        isAiming = abilityId;
                    } else if (abilityId === 'cyberBeam') {
                        abilities = abilities.map(a => a.id === abilityId ? { ...a, state: 'charging' as const, startTime: now } : a);
                        this.controlSound(this.audioManager.beamCharge, 'play');
                    } else if (abilityId === 'timeStop') {
                        abilities = abilities.map(a => a.id === abilityId ? { ...a, state: 'chargingHold' as const, chargeStartTime: now } : a);
                    } else {
                        abilities = abilities.map(a => a.id === abilityId ? { ...a, state: 'active' as const, startTime: now } : a);
                    }
                }
            }

            if (abilities !== prev.abilities || isAiming !== prev.isAiming) {
                return { ...prev, abilities, isAiming };
            }
            return prev;
        });
    }
    handleKeyUp(key: string) {
        this.keysPressed[key] = false;
        if (key === 'f' || key === 'g') this.setState(prev => prev.isAiming ? { ...prev, isAiming: null } : prev);
        if (key === 'y') {
            this.setState(prev => {
                const now = Date.now();
                const timeStop = prev.abilities.find(a => a.id === 'timeStop');
                if (!timeStop || timeStop.state !== 'chargingHold') return prev;

                const chargeProgress = (now - (timeStop.chargeStartTime || 0)) / (timeStop.chargeDuration || 1);
                if (chargeProgress >= 1) {
                    const newAbilities = prev.abilities.map(a => a.id === 'timeStop' ? { ...a, state: 'active' as const, startTime: now } : a);
                    return { ...prev, abilities: newAbilities, isTimeStopped: true };
                } else {
                    const newAbilities = prev.abilities.map(a => a.id === 'timeStop' ? { ...a, state: 'ready' as const, chargeStartTime: 0 } : a);
                    return { ...prev, abilities: newAbilities };
                }
            });
        }
    }
    handleMouseMove(pos: Vector) { this.mousePosition = pos; }
    handleMouseDown() {
        this.setState(prev => {
            if (prev.isAiming) {
                const now = Date.now();
                const aimingAbilityId = prev.isAiming;
                let newAbilities = prev.abilities;
                let newEffectZones = prev.effectZones;
                let newBarrageTarget: (Vector & { isChronoBoosted?: boolean; }) | null = prev.barrageTarget;
                let newBarrageStrikeStartTime: number | null = prev.barrageStrikeStartTime;
                
                newAbilities = newAbilities.map(a => a.id === aimingAbilityId ? { ...a, state: 'active' as const, startTime: now } : a);

                if (aimingAbilityId === 'barrage') {
                    this.triggerShake(15, BARRAGE_STRIKE_DURATION + BARRAGE_WARNING_DURATION);
                    newBarrageTarget = { ...this.mousePosition };
                    const isInChrono = prev.effectZones.some(z => z.type === 'chrono' && Math.hypot(this.mousePosition.x - z.position.x, this.mousePosition.y - z.position.y) < z.radius);
                    if (isInChrono) {
                        newBarrageTarget.isChronoBoosted = true;
                    }
                    newBarrageStrikeStartTime = now + BARRAGE_WARNING_DURATION;
                } else if (aimingAbilityId === 'chronoBubble') {
                    newEffectZones = [...prev.effectZones, { id: `chrono-${now}`, type: 'chrono', position: { ...this.mousePosition }, radius: CHRONO_BUBBLE_RADIUS, createdAt: now, duration: CHRONO_BUBBLE_DURATION }];
                }
                
                return { ...prev, isAiming: null, abilities: newAbilities, effectZones: newEffectZones, barrageTarget: newBarrageTarget, barrageStrikeStartTime: newBarrageStrikeStartTime };
            }
            return prev;
        });
    }

    update() {
        this.setState(prev => {
            // This is the entire logic from the original `gameLoop` useCallback
            const now = Date.now();
            let newPlayerState = { ...prev.player };
            let newAbilities = [...prev.abilities];
            let newMasteryNotification = prev.masteryNotification;
            
            const isTimeStopped = prev.isTimeStopped;

            let newAnimations = [...prev.animations.filter(anim => now - anim.createdAt < anim.duration)];
            let newDamageNumbers = [...prev.damageNumbers.filter(dn => now - dn.createdAt < dn.duration)];
            let newDamageIndicators = [...prev.damageIndicators.filter(di => now - di.createdAt < di.duration)];
            let newPowerUps = [...prev.powerUps];
            let newBarrageTarget = prev.barrageTarget;
            let newBarrageStrikeStartTime = prev.barrageStrikeStartTime;
            let newCyberBeamTarget = prev.cyberBeamTarget;
            let newLastBarrageImpactTime = prev.lastBarrageImpactTime;
            let newBossState: Boss | null = prev.boss ? JSON.parse(JSON.stringify(prev.boss)) : null; // Deep copy for mutable properties
            let newTelegraphs = isTimeStopped ? prev.telegraphs : [...prev.telegraphs.filter(t => now - t.createdAt < t.duration)];
            let newEffectZones = [...prev.effectZones.filter(z => now - z.createdAt < z.duration)];
            let newMinions = [...prev.minions];
            let newChronoShards = [...prev.chronoShards];
            
            const overdriveAbility = newAbilities.find(a => a.id === 'overdrive');
            const cyberBeamAbility = newAbilities.find(a => a.id === 'cyberBeam');
            const toxicRoundsAbility = newAbilities.find(a => a.id === 'toxicRounds');
            
            if (now - this.lastPowerUpSpawnTime > POWERUP_SPAWN_INTERVAL && newPowerUps.length < MAX_POWERUPS && !isTimeStopped) {
                this.lastPowerUpSpawnTime = now;
                const availableTypes: PowerUpType[] = ['dualCannon', 'shield', 'regensule', 'reflectorField', 'lifeLeech', 'homingMissiles'];
                const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                const allSolidTanks = [prev.player, ...prev.enemies, ...newMinions, ...(newBossState ? [newBossState] : [])].filter(t => t.status === 'active' || t.status === 'spawning');
                const position = this.findSafeSpawnPoint(allSolidTanks, {w: POWERUP_SIZE, h: POWERUP_SIZE});
                newPowerUps.push({ id: `pow-${now}`, type, position });
            }
            
            if (newPlayerState.status === 'spawning' && now >= (newPlayerState.spawnTime || 0) + SPAWN_DURATION) newPlayerState.status = 'active';
            if (newPlayerState.status === 'dying' && now >= (newPlayerState.deathTime || 0) + DEATH_DURATION) {
                newPlayerState = {
                    ...getInitialPlayerState(now), name: newPlayerState.name, score: newPlayerState.score, kills: newPlayerState.kills, deaths: newPlayerState.deaths + 1,
                    position: this.findSafeSpawnPoint([ ...(newBossState ? [newBossState] : []), ...prev.enemies.filter(e => e.status === 'active' || e.status === 'spawning')]),
                };
            }
            // Power-up expiration
            if (newPlayerState.activePowerUp && now > (newPlayerState.powerUpExpireTime || 0)) { 
                if (newPlayerState.activePowerUp === 'regensule') { newPlayerState.maxHealth = TANK_HEALTH; if (newPlayerState.health > TANK_HEALTH) newPlayerState.health = TANK_HEALTH; }
                newPlayerState.activePowerUp = null; newPlayerState.powerUpExpireTime = undefined; 
            }
             // Regensule health regeneration
             if (newPlayerState.activePowerUp === 'regensule' && now - this.lastRegenTime > REGENSULE_REGEN_INTERVAL) {
                if (newPlayerState.health < newPlayerState.maxHealth) {
                    newPlayerState.health = Math.min(newPlayerState.maxHealth, newPlayerState.health + REGENSULE_REGEN_RATE);
                }
                this.lastRegenTime = now;
            }

            // Game logic... (the rest of the massive update method)
            
            let enemiesAfterAI: TankType[] = [...prev.enemies];
            if (!isTimeStopped) {
                if (this.gamePhase !== 'boss') {
                    const intermediateEnemies: TankType[] = [];
                    for (const enemy of prev.enemies) {
                        let updatedEnemy: TankType = { ...enemy };
                        if (updatedEnemy.activePowerUp && now > (updatedEnemy.powerUpExpireTime || 0)) { updatedEnemy.activePowerUp = null; updatedEnemy.powerUpExpireTime = undefined; }
                        if (updatedEnemy.status === 'spawning' && now >= (updatedEnemy.spawnTime || 0) + SPAWN_DURATION) updatedEnemy.status = 'active';
                        if (updatedEnemy.status === 'dying' && now >= (updatedEnemy.respawnTime || 0)) {
                            const tanksToAvoidForRespawn = [newPlayerState, ...intermediateEnemies];
                            const newPosition = this.findSafeSpawnPoint(tanksToAvoidForRespawn);
                            const newTier = this.gamePhase === 'post-boss' ? 'intermediate' : 'basic';
                            const freshEnemy = getInitialEnemyState(enemy.id, enemy.name, newPosition, now, newTier);
                            updatedEnemy = { ...freshEnemy, score: enemy.score, kills: enemy.kills, deaths: enemy.deaths + 1 };
                        }
                        if (updatedEnemy.status === 'active' && updatedEnemy.statusEffects) {
                            updatedEnemy.statusEffects = updatedEnemy.statusEffects.filter(effect => {
                                switch (effect.type) {
                                    case 'poison':
                                        if (now - effect.lastApplied > effect.duration) return false;
                                        if (now - effect.lastTickTime > effect.tickInterval) {
                                            const damage = effect.tickDamage * effect.stacks;
                                            updatedEnemy.health -= damage; updatedEnemy.lastHitTime = now;
                                            effect.lastTickTime = now;
                                            newDamageNumbers.push({ id: `dn-poison-${enemy.id}-${now}`, text: damage.toFixed(2), position: { x: updatedEnemy.position.x + (Math.random() - 0.5) * 20, y: updatedEnemy.position.y - TANK_HEIGHT / 2 }, createdAt: now, duration: 1000, color: '#84cc16' });
                                        }
                                        return true;
                                    case 'stun':
                                        return now - effect.startTime < effect.duration;
                                }
                                return true;
                            });
                        }
                        intermediateEnemies.push(updatedEnemy);
                    }
                    const collectedPowerUpIds = new Set<string>();
                    enemiesAfterAI = intermediateEnemies.map(enemy => {
                      if (enemy.status !== 'active') return enemy;
                      const isStunned = enemy.statusEffects?.some(e => e.type === 'stun' && now - e.startTime < e.duration) ?? false;
                      if (isStunned) return enemy;
                      
                      let updatedEnemy: TankType = { ...enemy };
                      const enemyRect = { x: updatedEnemy.position.x - TANK_WIDTH / 2, y: updatedEnemy.position.y - TANK_HEIGHT / 2, width: TANK_WIDTH, height: TANK_HEIGHT };
                      for (const powerUp of newPowerUps) {
                          if (collectedPowerUpIds.has(powerUp.id)) continue;
                          const powerUpRect = { x: powerUp.position.x - POWERUP_SIZE / 2, y: powerUp.position.y - POWERUP_SIZE / 2, width: POWERUP_SIZE, height: POWERUP_SIZE };
                          if (this.checkCollision(enemyRect, powerUpRect)) {
                              collectedPowerUpIds.add(powerUp.id);
                              if (powerUp.type === 'shield') { updatedEnemy.activePowerUp = 'shield'; updatedEnemy.shieldHealth = SHIELD_HEALTH; updatedEnemy.powerUpExpireTime = now + 10000; }
                              else if (powerUp.type === 'dualCannon') { updatedEnemy.activePowerUp = 'dualCannon'; updatedEnemy.powerUpExpireTime = now + DUAL_CANNON_DURATION; }
                              break;
                          }
                      }
                      
                      const otherActiveTanks = [newPlayerState, ...intermediateEnemies].filter(t => t.id !== enemy.id && t.status === 'active');
                      const playerPos = newPlayerState.position;
                      const playerIsTargetable = newPlayerState.status === 'active' || newPlayerState.status === 'spawning';
                      
                      let speedModifier = 1.0;
                      const activeChrono = newEffectZones.find(z => z.type === 'chrono' && Math.hypot(enemy.position.x - z.position.x, enemy.position.y - z.position.y) < z.radius);
                      if (activeChrono) speedModifier = CHRONO_BUBBLE_SLOW_FACTOR;

                      let newPath = updatedEnemy.path; let newPatrolTarget = updatedEnemy.patrolTarget; let targetForMovement: Vector | null = null;
                      if (playerIsTargetable) {
                        targetForMovement = playerPos;
                      } else {
                         if (!newPatrolTarget || (newPath && newPath.length === 0) || (newPatrolTarget && Math.hypot(newPatrolTarget.x - enemy.position.x, newPatrolTarget.y - enemy.position.y) < PATHFINDING_CELL_SIZE)) {
                            newPatrolTarget = this.findSafeSpawnPoint(otherActiveTanks);
                         }
                         targetForMovement = newPatrolTarget;
                      }

                      let newPos = { ...enemy.position }; let newBodyAngle = enemy.angle;
                      if (targetForMovement) {
                           const currentSpeed = (enemy.tier === 'intermediate' ? this.difficultyParams.intermediateEnemySpeed : this.difficultyParams.enemySpeed) * speedModifier;
                           const tdx = targetForMovement.x - enemy.position.x; const tdy = targetForMovement.y - enemy.position.y;
                           if (Math.hypot(tdx, tdy) > currentSpeed) {
                              const velX = (tdx / Math.hypot(tdx, tdy)) * currentSpeed; const velY = (tdy / Math.hypot(tdx, tdy)) * currentSpeed;
                              if (!this.isCollidingWithEnvironment({x: newPos.x + velX - TANK_WIDTH/2, y: newPos.y - TANK_HEIGHT/2, width: TANK_WIDTH, height: TANK_HEIGHT}, otherActiveTanks)) newPos.x += velX;
                              if (!this.isCollidingWithEnvironment({x: newPos.x - TANK_WIDTH/2, y: newPos.y + velY - TANK_HEIGHT/2, width: TANK_WIDTH, height: TANK_HEIGHT}, otherActiveTanks)) newPos.y += velY;
                           }
                          if (Math.hypot(newPos.x - enemy.position.x, newPos.y - enemy.position.y) > 0.1) newBodyAngle = Math.atan2(newPos.y - enemy.position.y, newPos.x - enemy.position.x) * (180 / Math.PI) + 90;
                      }
                      
                      let newTurretAngle = updatedEnemy.turretAngle;
                      if (playerIsTargetable) {
                          const targetAngle = Math.atan2(playerPos.y - newPos.y, playerPos.x - newPos.x) * (180 / Math.PI) + 90;
                          let currentAngle = enemy.turretAngle; let angleDiff = targetAngle - currentAngle;
                          while (angleDiff < -180) angleDiff += 360; while (angleDiff > 180) angleDiff -= 360;
                          const turnSpeed = this.difficultyParams.turretTurnSpeed * speedModifier;
                          if (Math.abs(angleDiff) < turnSpeed) currentAngle = targetAngle; else currentAngle += Math.sign(angleDiff) * turnSpeed;
                          newTurretAngle = (currentAngle % 360 + 360) % 360;
                      }
                      
                      return { ...updatedEnemy, position: newPos, angle: newBodyAngle, turretAngle: newTurretAngle, path: newPath, patrolTarget: newPatrolTarget };
                    });
                    if (collectedPowerUpIds.size > 0) { newPowerUps = newPowerUps.filter(p => !collectedPowerUpIds.has(p.id)); }
                }
            }

            if (newPlayerState.status === 'active') {
                const speedMultiplier = overdriveAbility?.state === 'active' ? OVERDRIVE_SPEED_MULTIPLIER : (prev.isAiming === 'barrage' || prev.isAiming === 'chronoBubble') ? BARRAGE_AIM_SLOW_FACTOR : 1;
                let playerVelocity = { x: 0, y: 0 };
                const up = this.settings.controls === ControlScheme.WASD ? 'w' : 'arrowup'; const down = this.settings.controls === ControlScheme.WASD ? 's' : 'arrowdown'; const left = this.settings.controls === ControlScheme.WASD ? 'a' : 'arrowleft'; const right = this.settings.controls === ControlScheme.WASD ? 'd' : 'arrowright';
                const velocity = { x: 0, y: 0 };
                if (this.keysPressed[up]) velocity.y -= 1; if (this.keysPressed[down]) velocity.y += 1; if (this.keysPressed[left]) velocity.x -= 1; if (this.keysPressed[right]) velocity.x += 1;
                
                if (velocity.x !== 0 || velocity.y !== 0) {
                    const magnitude = Math.hypot(velocity.x, velocity.y); const vx = (velocity.x / magnitude) * PLAYER_SPEED * speedMultiplier; const vy = (velocity.y / magnitude) * PLAYER_SPEED * speedMultiplier; playerVelocity = { x: vx, y: vy };
                    const potentialX = newPlayerState.position.x + vx; const potentialY = newPlayerState.position.y + vy;
                    if (!this.isCollidingWithEnvironment({ x: potentialX - TANK_WIDTH/2, y: newPlayerState.position.y - TANK_HEIGHT/2, width: TANK_WIDTH, height: TANK_HEIGHT }, enemiesAfterAI.filter(e => e.status === 'active'))) newPlayerState.position.x = potentialX;
                    if (!this.isCollidingWithEnvironment({ x: newPlayerState.position.x - TANK_WIDTH/2, y: potentialY - TANK_HEIGHT/2, width: TANK_WIDTH, height: TANK_HEIGHT }, enemiesAfterAI.filter(e => e.status === 'active'))) newPlayerState.position.y = potentialY;
                    newPlayerState.angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI) + 90;
                }
                newPlayerState.velocity = playerVelocity;
                const dx = this.mousePosition.x - newPlayerState.position.x; const dy = this.mousePosition.y - newPlayerState.position.y;
                newPlayerState.turretAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            } else { newPlayerState.velocity = { x: 0, y: 0 }; }
            this.playerHistory = [...this.playerHistory, { pos: newPlayerState.position, time: now }].filter(p => p.time > now - 4000);

            const playerRect = { x: newPlayerState.position.x - TANK_WIDTH / 2, y: newPlayerState.position.y - TANK_HEIGHT / 2, width: TANK_WIDTH, height: TANK_HEIGHT };
            for (const powerUp of newPowerUps) {
                const powerUpRect = { x: powerUp.position.x - POWERUP_SIZE / 2, y: powerUp.position.y - POWERUP_SIZE / 2, width: POWERUP_SIZE, height: POWERUP_SIZE };
                if (newPlayerState.status === 'active' && this.checkCollision(playerRect, powerUpRect)) {
                    newPowerUps = newPowerUps.filter(p => p.id !== powerUp.id);
                    newPlayerState.activePowerUp = powerUp.type;
                    switch(powerUp.type) {
                        case 'shield': newPlayerState.shieldHealth = SHIELD_HEALTH; newPlayerState.powerUpExpireTime = now + 10000; break;
                        case 'dualCannon': newPlayerState.powerUpExpireTime = now + DUAL_CANNON_DURATION; break;
                        case 'regensule': newPlayerState.maxHealth += REGENSULE_HEALTH_BONUS; newPlayerState.health += REGENSULE_HEALTH_BONUS; newPlayerState.powerUpExpireTime = now + REGENSULE_DURATION; break;
                        case 'reflectorField': newPlayerState.powerUpExpireTime = now + REFLECTOR_FIELD_DURATION; break;
                        case 'lifeLeech': newPlayerState.powerUpExpireTime = now + LIFE_LEECH_DURATION; break;
                        case 'homingMissiles': newPlayerState.homingMissileCount = HOMING_MISSILE_COUNT; newPlayerState.powerUpExpireTime = now + 60000; break; // Long expire time in case of not firing
                    }
                }
            }
            
            const createdProjectiles: ProjectileType[] = [];
            const fire = (tank: TankType | Minion) => {
                 this.playPooledSound('shot');
                 const isOverdriveMastered = overdriveAbility?.state === 'active' && overdriveAbility.mastered;
                 let damage = 1;
                 let muzzlePos: Vector;
                 let angle: number;
                 let ownerId: string;
                 let color: string = '#F000B8'; // default for minions

                if ('type' in tank) { // It's a Tank
                    ownerId = tank.id;
                    angle = tank.turretAngle;
                    color = tank.color;
                    damage = (tank.id === 'player' && isOverdriveMastered) ? 1 + MASTERED_OVERDRIVE_DAMAGE_BONUS : 1;
                    const rad = (tank.turretAngle - 90) * (Math.PI/180);
                    muzzlePos = { x: tank.position.x + Math.cos(rad) * BARREL_LENGTH, y: tank.position.y + Math.sin(rad) * BARREL_LENGTH };

                    if (tank.id === 'player' && tank.homingMissileCount && tank.homingMissileCount > 0) {
                        tank.homingMissileCount--;
                        if(tank.homingMissileCount <= 0) { tank.activePowerUp = null; }
                        createdProjectiles.push({ id: `p-homing-${now}`, ownerId: tank.id, position: muzzlePos, angle: tank.turretAngle, size: {width: 10, height: 15}, isHoming: true, turnRate: HOMING_MISSILE_TURN_RATE, damage });
                        return; // Homing missile fired, don't fire standard shots
                    } else if (tank.tier === 'intermediate') {
                        const spreadAngles = [-15, 0, 15];
                        spreadAngles.forEach(offset => {
                            const spreadAngle = tank.turretAngle + offset; const spreadRad = (spreadAngle - 90) * (Math.PI/180);
                            const spreadMuzzlePos = { x: tank.position.x + Math.cos(spreadRad) * BARREL_LENGTH, y: tank.position.y + Math.sin(spreadRad) * BARREL_LENGTH };
                            createdProjectiles.push({ id: `p-${tank.id}-${now}-${offset}`, ownerId: tank.id, position: spreadMuzzlePos, angle: spreadAngle, size: { width: PROJECTILE_SIZE, height: PROJECTILE_SIZE }, damage });
                        });
                        newAnimations.push({ id: `mf-${tank.id}-${now}`, type: 'muzzleFlash', createdAt: now, duration: MUZZLE_FLASH_DURATION, position: muzzlePos, angle: tank.turretAngle, color: tank.color });
                        return;
                    } else if (tank.activePowerUp === 'dualCannon') {
                        const rad = (tank.turretAngle - 90) * (Math.PI/180); const perpRad = rad + Math.PI / 2; const offset = TANK_WIDTH * 0.15;
                        const muzzlePos1 = { x: tank.position.x + Math.cos(rad) * BARREL_LENGTH + Math.cos(perpRad) * offset, y: tank.position.y + Math.sin(rad) * BARREL_LENGTH + Math.sin(perpRad) * offset };
                        const muzzlePos2 = { x: tank.position.x + Math.cos(rad) * BARREL_LENGTH - Math.cos(perpRad) * offset, y: tank.position.y + Math.sin(rad) * BARREL_LENGTH - Math.sin(perpRad) * offset };
                        createdProjectiles.push({ id: `p1-${tank.id}-${now}`, ownerId: tank.id, position: muzzlePos1, angle: tank.turretAngle, size: { width: PROJECTILE_SIZE, height: PROJECTILE_SIZE }, damage });
                        createdProjectiles.push({ id: `p2-${tank.id}-${now}`, ownerId: tank.id, position: muzzlePos2, angle: tank.turretAngle, size: { width: PROJECTILE_SIZE, height: PROJECTILE_SIZE }, damage });
                        newAnimations.push({ id: `mf1-${tank.id}-${now}`, type: 'muzzleFlash', createdAt: now, duration: MUZZLE_FLASH_DURATION, position: muzzlePos1, angle: tank.turretAngle, color: tank.color });
                        newAnimations.push({ id: `mf2-${tank.id}-${now}`, type: 'muzzleFlash', createdAt: now, duration: MUZZLE_FLASH_DURATION, position: muzzlePos2, angle: tank.turretAngle, color: tank.color });
                        return;
                    }
                } else { // It's a Minion
                    ownerId = tank.id;
                    angle = tank.angle;
                    damage = MINION_PROJECTILE_DAMAGE;
                    const rad = (tank.angle - 90) * (Math.PI/180);
                    const GUN_LENGTH = 35;
                    const GUN_Y_OFFSET = MINION_SIZE.height / 2 - 5;
                    muzzlePos = {
                        x: tank.position.x + Math.cos(rad) * (GUN_LENGTH + GUN_Y_OFFSET),
                        y: tank.position.y + Math.sin(rad) * (GUN_LENGTH + GUN_Y_OFFSET)
                    };
                }
                 
                createdProjectiles.push({ id: `p-${ownerId}-${now}`, ownerId, position: muzzlePos, angle, size: { width: PROJECTILE_SIZE, height: PROJECTILE_SIZE }, damage });
                newAnimations.push({ id: `mf-${ownerId}-${now}`, type: 'muzzleFlash', createdAt: now, duration: MUZZLE_FLASH_DURATION, position: muzzlePos, angle, color });
            };

            const fireCooldownMultiplier = overdriveAbility?.state === 'active'
                ? (overdriveAbility.mastered ? MASTERED_OVERDRIVE_FIRE_RATE_MULTIPLIER : OVERDRIVE_FIRE_RATE_MULTIPLIER)
                : 1.0;
            const fireCooldown = FIRE_COOLDOWN * fireCooldownMultiplier;
            if (newPlayerState.status === 'active' && this.keysPressed[' '] && now - this.lastFireTime.player > fireCooldown) { this.lastFireTime.player = now; fire(newPlayerState); }
            
            if (!isTimeStopped) {
                enemiesAfterAI.forEach(enemy => {
                    if (enemy.status !== 'active') return;
                    const isStunned = enemy.statusEffects?.some(e => e.type === 'stun') ?? false;
                    if (isStunned) return;

                    const los = hasLineOfSight(enemy.position, newPlayerState.position, initialWalls) && Math.hypot(newPlayerState.position.x-enemy.position.x, newPlayerState.position.y-enemy.position.y) <= this.difficultyParams.detectionRadius;
                    const fireRateMod = enemy.tier === 'intermediate' ? this.difficultyParams.intermediateFireRateModifier : this.difficultyParams.fireRateModifier;
                    const baseCooldown = (1500 + Math.random() * 500) / fireRateMod;
                    const hesitation = Math.random() * this.difficultyParams.firingHesitationMs;
                    if (los && now - (this.lastFireTime[enemy.id] || 0) > baseCooldown + hesitation) { this.lastFireTime[enemy.id] = now; fire(enemy); }
                });
                newMinions.forEach(minion => {
                    if (minion.status === 'active') {
                        const isStunned = minion.statusEffects?.some(e => e.type === 'stun' && now - e.startTime < e.duration) ?? false;
                        if (isStunned) return;

                        const losToPlayer = hasLineOfSight(minion.position, newPlayerState.position, initialWalls);
                        if (losToPlayer && now - (minion.lastFireTime || 0) > MINION_FIRE_COOLDOWN + Math.random() * 500) {
                            minion.lastFireTime = now;
                            fire(minion);
                        }
                    }
                });
            }

            if (newBarrageStrikeStartTime && now >= newBarrageStrikeStartTime && newBarrageTarget && !isTimeStopped) {
                const currentBarrageRadius = newBarrageTarget.isChronoBoosted ? BARRAGE_RADIUS * 0.7 : BARRAGE_RADIUS;
                const currentImpactInterval = newBarrageTarget.isChronoBoosted ? BARRAGE_IMPACT_INTERVAL * 0.6 : BARRAGE_IMPACT_INTERVAL;

                if (now <= newBarrageStrikeStartTime + BARRAGE_STRIKE_DURATION) {
                    if(newBossState && newBossState.status === 'active' && Math.hypot(newBossState.position.x - newBarrageTarget.x, newBossState.position.y - newBarrageTarget.y) <= currentBarrageRadius + newBossState.size.width / 2) {
                        newBossState.health -= BARRAGE_DAMAGE_PER_TICK; newBossState.lastHitTime = now;
                        newDamageNumbers.push({id: `dn-barrage-boss-${now}`, text: BARRAGE_DAMAGE_PER_TICK.toFixed(2), position: { ...newBossState.position, y: newBossState.position.y - newBossState.size.height / 2 }, createdAt: now, duration: 1000, color: '#f97316' });
                    }
                    enemiesAfterAI.forEach(enemy => {
                        if (enemy.status === 'active' && Math.hypot(enemy.position.x - newBarrageTarget!.x, enemy.position.y - newBarrageTarget!.y) <= currentBarrageRadius) {
                            enemy.health -= BARRAGE_DAMAGE_PER_TICK; enemy.lastHitTime = now;
                            newDamageNumbers.push({id: `dn-barrage-${enemy.id}-${now}`, text: BARRAGE_DAMAGE_PER_TICK.toFixed(2), position: { ...enemy.position, y: enemy.position.y - enemy.size.height / 2 }, createdAt: now, duration: 1000, color: '#f97316' });
                        }
                    });
                    if (now - newLastBarrageImpactTime > currentImpactInterval) {
                        this.playPooledSound('shot'); newLastBarrageImpactTime = now;
                        const impactPos = { x: newBarrageTarget.x + (Math.random() - 0.5) * 2 * currentBarrageRadius, y: newBarrageTarget.y + (Math.random() - 0.5) * 2 * currentBarrageRadius };
                        newAnimations.push({ id: `b-impact-${now}-${Math.random()}`, type: 'barrageImpact', createdAt: now, duration: BARRAGE_IMPACT_DURATION, position: impactPos });
                    }
                }
            }
            
            const allProjectiles = [...prev.projectiles, ...createdProjectiles]; let updatedProjs: ProjectileType[] = []; const tanksById = new Map<string, TankType | Boss | Minion>();
            tanksById.set(newPlayerState.id, newPlayerState); enemiesAfterAI.forEach(e => tanksById.set(e.id, e));
            newMinions.forEach(m => tanksById.set(m.id, m));
            if (newBossState) tanksById.set(newBossState.id, newBossState);

            if (isTimeStopped && cyberBeamAbility?.state === 'active') {
                if (now - this.lastChronoShardTime > CHRONO_SHARD_SPAWN_INTERVAL) {
                    this.lastChronoShardTime = now;
                    const rad = (newPlayerState.turretAngle - 90) * (Math.PI / 180);
                    const shardPos = { x: newPlayerState.position.x + Math.cos(rad) * BARREL_LENGTH, y: newPlayerState.position.y + Math.sin(rad) * BARREL_LENGTH };
                    newChronoShards.push({ position: shardPos, angle: newPlayerState.turretAngle, createdAt: now });
                }
                newCyberBeamTarget = null;
            } else if (cyberBeamAbility?.state === 'active' && newCyberBeamTarget) {
                const rad = (newPlayerState.turretAngle - 90) * (Math.PI / 180); const beamEnd = newCyberBeamTarget;
                const beamStarts = newPlayerState.activePowerUp === 'dualCannon'
                    ? [ { x: newPlayerState.position.x + Math.cos(rad) * BARREL_LENGTH + Math.cos(rad + Math.PI/2) * (TANK_WIDTH * 0.15), y: newPlayerState.position.y + Math.sin(rad) * BARREL_LENGTH + Math.sin(rad + Math.PI/2) * (TANK_WIDTH * 0.15) }, { x: newPlayerState.position.x + Math.cos(rad) * BARREL_LENGTH - Math.cos(rad + Math.PI/2) * (TANK_WIDTH * 0.15), y: newPlayerState.position.y + Math.sin(rad) * BARREL_LENGTH - Math.sin(rad + Math.PI/2) * (TANK_WIDTH * 0.15) } ]
                    : [{ x: newPlayerState.position.x + Math.cos(rad) * BARREL_LENGTH, y: newPlayerState.position.y + Math.sin(rad) * BARREL_LENGTH }];
                // FIX: Use a type guard to ensure the 'type' property exists before accessing it, resolving an error where 'Boss' types were causing a crash.
                for (const target of Array.from(tanksById.values()).filter(t => t.status === 'active' && (!('type' in t) || t.type !== 'player'))) {
                    const targetSize = 'size' in target ? target.size : MINION_SIZE;
                    const targetRect = { x: target.position.x - targetSize.width / 2, y: target.position.y - targetSize.height / 2, width: targetSize.width, height: targetSize.height };
                    if (beamStarts.some(start => lineIntersectsRect(start, beamEnd, targetRect)) && now - (this.lastCyberBeamDamageTime[target.id] || 0) > CYBER_BEAM_DAMAGE_INTERVAL) {
                        this.lastCyberBeamDamageTime[target.id] = now;
                        if (target.health > 0) {
                             target.health -= CYBER_BEAM_DAMAGE; target.lastHitTime = now;
                             const damageText = CYBER_BEAM_DAMAGE.toFixed(2);
                             const beamColor = toxicRoundsAbility?.state === 'active' ? '#84cc16' : '#d946ef';
                             newDamageNumbers.push({id: `dn-beam-${target.id}-${now}`, text: damageText, position: { ...target.position, y: target.position.y - targetSize.height / 2 }, createdAt: now, duration: 800, color: beamColor });
                             if (newPlayerState.activePowerUp === 'lifeLeech') {
                                 newPlayerState.health = Math.min(newPlayerState.maxHealth, newPlayerState.health + (CYBER_BEAM_DAMAGE * LIFE_LEECH_AMOUNT));
                             }
                             const CYBER_BEAM_POISON_INTERVAL = 500;
                             if (toxicRoundsAbility?.state === 'active' && now - (this.lastCyberBeamPoisonTime[target.id] || 0) > CYBER_BEAM_POISON_INTERVAL) {
                                this.lastCyberBeamPoisonTime[target.id] = now;
                                this.applyPoison(target as (TankType | Boss | Minion), 1, now);
                            }
                        }
                    }
                }
            }

            for (const proj of allProjectiles) {
                if (proj.isFrozen) {
                    updatedProjs.push(proj); continue;
                }
            
                let speedModifier = 1.0; let newPos = proj.position; let newAngle = proj.angle;
                const activeChrono = newEffectZones.find(z => z.type === 'chrono' && Math.hypot(proj.position.x - z.position.x, proj.position.y - z.position.y) < z.radius);
                if (activeChrono) speedModifier = CHRONO_BUBBLE_SLOW_FACTOR;
                
                const moveProjectile = (proj.ownerId === 'player' || !isTimeStopped);

                if (moveProjectile) {
                    if (proj.isHoming) {
                        let target: TankType | Boss | Minion | null = null;
                        if (proj.targetId) {
                            target = tanksById.get(proj.targetId) || null;
                            if (!target || target.status !== 'active') {
                                proj.targetId = undefined; // Clear it to re-acquire
                                target = null;
                            }
                        }
                        if (!target && !proj.isChronoShard) { // Only missiles re-acquire like this
                            let closestEnemy: TankType | Boss | null = null; let minDistance = Infinity;
                            const potentialTargets = [...enemiesAfterAI, ...(newBossState ? [newBossState] : [])].filter(e => e.status === 'active');
                            potentialTargets.forEach(enemy => { const d = Math.hypot(enemy.position.x - proj.position.x, enemy.position.y - proj.position.y); if (d < minDistance) { minDistance = d; closestEnemy = enemy; } });
                            target = closestEnemy;
                        }
                        if (target) {
                            const turnRate = proj.isChronoShard ? 8 : HOMING_MISSILE_TURN_RATE;
                            const targetAngle = Math.atan2(target.position.y - proj.position.y, target.position.x - proj.position.x) * (180/Math.PI) + 90;
                            let angleDiff = targetAngle - newAngle; while (angleDiff < -180) angleDiff += 360; while(angleDiff > 180) angleDiff -= 360;
                            if (Math.abs(angleDiff) < turnRate) newAngle = targetAngle; else newAngle += Math.sign(angleDiff) * turnRate;
                        }
                        const speed = proj.isChronoShard ? HOMING_MISSILE_SPEED * 1.5 : HOMING_MISSILE_SPEED;
                        const rad = (newAngle - 90) * (Math.PI/180);
                        newPos = { x: proj.position.x + Math.cos(rad) * speed * speedModifier, y: proj.position.y + Math.sin(rad) * speed * speedModifier };
                    } else if (proj.isChronoShard) {
                        const rad = (proj.angle - 90) * (Math.PI / 180);
                        newPos = { x: proj.position.x + Math.cos(rad) * PROJECTILE_SPEED * 4, y: proj.position.y + Math.sin(rad) * PROJECTILE_SPEED * 4 }; // Very fast
                    } else {
                        const speed = proj.ownerId.startsWith('minion-') ? MINION_PROJECTILE_SPEED : PROJECTILE_SPEED;
                        const rad = (proj.angle - 90) * (Math.PI / 180);
                        newPos = { x: proj.position.x + Math.cos(rad) * speed * speedModifier, y: proj.position.y + Math.sin(rad) * speed * speedModifier };
                    }
                }
                
                const projRect = { x: newPos.x - proj.size.width/2, y: newPos.y - proj.size.height/2, width: proj.size.width, height: proj.size.height };
                let hit = false;
                
                if (newPos.x < 0 || newPos.x > ARENA_WIDTH || newPos.y < 0 || newPos.y > ARENA_HEIGHT || initialWalls.some(wall => this.checkCollision(projRect, wall))) {
                    if (isTimeStopped && proj.ownerId === 'player' && !proj.isChronoShard) {
                        updatedProjs.push({ ...proj, position: newPos, isFrozen: true });
                    } else if (proj.isChronoShard) {
                        newAnimations.push({ id: `cs-impact-${proj.id}`, type: 'chronoShardImpact', createdAt: now, duration: 300, position: proj.position });
                    } else {
                        newAnimations.push({ id: `hit-${proj.id}`, type: 'hit', createdAt: now, duration: HIT_ANIMATION_DURATION, position: proj.position });
                    }
                    continue; // Skip the rest of the loop for this projectile
                }
                for (const target of Array.from(tanksById.values()).filter(t => t.id !== proj.ownerId && (t.status === 'active' || t.status === 'spawning'))) {
                    const targetSize = 'size' in target ? target.size : MINION_SIZE;
                    const targetRect = { x: target.position.x - targetSize.width / 2, y: target.position.y - targetSize.height / 2, width: targetSize.width, height: targetSize.height };
                    if ('isInvulnerable' in target && target.isInvulnerable) continue;
                    if (this.checkCollision(projRect, targetRect)) {
                        if (isTimeStopped && proj.ownerId === 'player' && !proj.isChronoShard) {
                             updatedProjs.push({ ...proj, position: newPos, isFrozen: true });
                        } else if (target.id === newPlayerState.id && newPlayerState.activePowerUp === 'reflectorField') {
                            const reflectedProj = {...proj, ownerId: 'player', angle: proj.angle + 180};
                            updatedProjs.push(reflectedProj);
                        } else if (target.status === 'spawning' && now - (target.spawnTime || 0) < SPAWN_INVULNERABILITY) {} 
                        else if ('activePowerUp' in target && target.activePowerUp === 'shield' && target.shieldHealth && target.shieldHealth > 0) {
                            target.shieldHealth -= 1; newAnimations.push({ id: `shieldHit-${proj.id}`, type: 'shieldHit', createdAt: now, duration: 300, position: proj.position, color: ('color' in target ? target.color : '#FFFFFF') });
                            if (target.shieldHealth <= 0) { target.activePowerUp = null; target.shieldHealth = undefined; newAnimations.push({ id: `shieldBreak-${target.id}-${now}`, type: 'shieldBreak', createdAt: now, duration: 400, position: target.position, color: ('color' in target ? target.color : '#FFFFFF') }); this.triggerShake(8, 300); }
                        } else if (target.health > 0) { 
                            if (proj.isHoming && !proj.isChronoShard) {
                                newAnimations.push({id: `homing-exp-${proj.id}`, type: 'homingExplosion', createdAt: now, duration: HOMING_EXPLOSION_DURATION, position: proj.position});
                                this.triggerShake(12, 400);
                                if (target.health > 0) {
                                    target.health -= HOMING_MISSILE_DIRECT_DAMAGE; target.lastHitTime = now;
                                    const directDamageText = HOMING_MISSILE_DIRECT_DAMAGE.toFixed(1).replace('.0', '');
                                    const tSizeDirect = 'size' in target ? target.size : MINION_SIZE;
                                    newDamageNumbers.push({id: `dn-homing-direct-${target.id}-${now}`, text: directDamageText, position: { ...target.position, y: target.position.y - tSizeDirect.height / 2 }, createdAt: now, duration: 1000, color: '#fcd34d' });
                                }
                                const aoeTargets = [...enemiesAfterAI, ...(newBossState ? [newBossState] : []), newPlayerState, ...newMinions].filter(t => t.id !== target.id && t.status === 'active' && Math.hypot(t.position.x - proj.position.x, t.position.y - proj.position.y) < HOMING_MISSILE_AOE_RADIUS);
                                aoeTargets.forEach(t => { t.health -= HOMING_MISSILE_AOE_DAMAGE; t.lastHitTime = now; const splashDamageText = HOMING_MISSILE_AOE_DAMAGE.toFixed(2); const tSizeSplash = 'size' in t ? t.size : MINION_SIZE; newDamageNumbers.push({id: `dn-homing-splash-${t.id}-${now}`, text: splashDamageText, position: { ...t.position, y: t.position.y - tSizeSplash.height / 2 }, createdAt: now, duration: 1000, color: '#fb923c' }); });
                            } else {
                                const damage = proj.isChronoShard ? CHRONO_SHARD_DAMAGE : (proj.damage || 1);
                                target.health -= damage; 
                                target.lastHitTime = now; 
                                if (proj.isChronoShard) {
                                    newAnimations.push({ id: `cs-impact-${proj.id}`, type: 'chronoShardImpact', createdAt: now, duration: 300, position: proj.position });
                                    this.applyStun(target as TankType | Boss | Minion, CHRONO_SHARD_STAGGER_DURATION, now);
                                } else {
                                    newAnimations.push({ id: `hit-${proj.id}`, type: 'hit', createdAt: now, duration: HIT_ANIMATION_DURATION, position: proj.position, color: ('color' in target ? target.color : '#ef4444') });
                                }
                                const damageText = damage.toFixed(damage % 1 === 0 ? 0 : 1);
                                const isPlayerDamage = proj.ownerId === 'player';
                                let damageColor = isPlayerDamage ? (proj.isChronoShard ? '#93c5fd' : '#f59e0b') : '#E0E5F0';
                                if (isPlayerDamage && toxicRoundsAbility?.state === 'active') damageColor = '#84cc16';
                                const targetSize = 'size' in target ? target.size : MINION_SIZE;
                                newDamageNumbers.push({id: `dn-${proj.id}-${target.id}`, text: damageText, position: { x: target.position.x + (Math.random() - 0.5) * 20, y: target.position.y - targetSize.height / 2 }, createdAt: now, duration: 1000, color: damageColor });

                                if (target.id === 'player') {
                                    const owner = tanksById.get(proj.ownerId);
                                    if(owner) newDamageIndicators.push({id: `di-${proj.id}`, angle: Math.atan2(owner.position.y - target.position.y, owner.position.x - target.position.x) * (180 / Math.PI), createdAt: now, duration: 1500 });
                                } else if (isPlayerDamage && newPlayerState.activePowerUp === 'lifeLeech') {
                                    newPlayerState.health = Math.min(newPlayerState.maxHealth, newPlayerState.health + (damage * LIFE_LEECH_AMOUNT));
                                }
                                
                                if (isPlayerDamage && toxicRoundsAbility?.state === 'active') {
                                    const stacksToApply = overdriveAbility?.state === 'active' ? 2 : 1;
                                    this.applyPoison(target as (TankType | Boss | Minion), stacksToApply, now);
                                }
                            }
                        }
                        hit = true; break;
                    }
                }
                if (!hit) updatedProjs.push({ ...proj, position: newPos, angle: newAngle });
            }
            
            const allTanksAndBossAndMinions = [...enemiesAfterAI, ...(newBossState ? [newBossState] : []), ...newMinions];
            allTanksAndBossAndMinions.forEach(enemy => {
                if (enemy.status === 'active' && enemy.health <= 0) {
                    enemy.status = 'dying'; enemy.deathTime = now; newAnimations.push({ id: `exp-${enemy.id}-${now}`, type: 'explosion', createdAt: now, duration: DEATH_DURATION, position: enemy.position, color: ('color' in enemy ? enemy.color : '#ef4444') });
                    this.triggerShake(7, 400); 

                    if ('type' in enemy) { // It's a Tank or Boss
                        if ('respawnTime' in enemy) enemy.respawnTime = now + DEATH_DURATION + RESPAWN_DELAY;
                        newPlayerState.kills += 1; 
                        newPlayerState.score += (enemy.id === 'boss-1' ? 1000 : KILL_SCORE);
                        const od = newAbilities.find(a => a.id === 'overdrive');
                        if (od && !od.mastered && newPlayerState.kills >= OVERDRIVE_MASTERY_KILLS) {
                            od.mastered = true;
                            newMasteryNotification = { text: 'OVERDRIVE MASTERY UNLOCKED', startTime: now };
                        }
                    } else { // It's a Minion
                        newPlayerState.score += MINION_KILL_SCORE;
                    }
                }
            });
            
            newMinions = newMinions.filter(m => !(m.status === 'dying' && now >= (m.deathTime || 0) + DEATH_DURATION));
            
            newAbilities = prev.abilities.map(ability => {
                let currentDuration = ability.duration;
                let currentCooldown = ability.cooldown;
        
                if (ability.id === 'overdrive' && ability.mastered) {
                    currentDuration = MASTERED_OVERDRIVE_DURATION;
                    currentCooldown = MASTERED_OVERDRIVE_COOLDOWN;
                }
                
                if (ability.id === 'cyberBeam') {
                    if (ability.state === 'charging') {
                        if (now >= ability.startTime + CYBER_BEAM_CHARGE_TIME) {
                            newCyberBeamTarget = { ...this.mousePosition };
                            this.controlSound(this.audioManager.beamCharge, 'stop');
                            this.controlSound(this.audioManager.beamActive, 'play');
                            return { ...ability, state: 'active', startTime: now };
                        }
                        if (!this.keysPressed['e'] || newPlayerState.status !== 'active') {
                            this.controlSound(this.audioManager.beamCharge, 'stop');
                            return { ...ability, state: 'ready', startTime: 0 };
                        }
                    } else if (ability.state === 'active') {
                        if (!this.keysPressed['e'] || newPlayerState.status !== 'active') {
                            this.controlSound(this.audioManager.beamActive, 'stop');
                            newCyberBeamTarget = null;
                            return { ...ability, state: 'cooldown', startTime: now };
                        } else if (!isTimeStopped) { // Only update target if not creating shards
                            const currentTarget = prev.cyberBeamTarget || this.mousePosition;
                            newCyberBeamTarget = { x: currentTarget.x + (this.mousePosition.x - currentTarget.x) * CYBER_BEAM_INTERPOLATION_FACTOR, y: currentTarget.y + (this.mousePosition.y - currentTarget.y) * CYBER_BEAM_INTERPOLATION_FACTOR };
                        }
                    }
                }
                
                if (ability.state === 'active' && now >= ability.startTime + currentDuration) {
                    if (ability.id === 'barrage') { newBarrageTarget = null; newBarrageStrikeStartTime = null; }
                    if (ability.id === 'cyberBeam') { this.controlSound(this.audioManager.beamActive, 'stop'); newCyberBeamTarget = null; }
                    if (ability.id === 'timeStop') {
                        updatedProjs = updatedProjs.map(p => p.isFrozen ? { ...p, isFrozen: false } : p);
                    }
                    return { ...ability, state: 'cooldown', startTime: now };
                } else if (ability.state === 'cooldown' && now >= ability.startTime + currentCooldown) {
                    return { ...ability, state: 'ready', startTime: 0 };
                }
                return ability;
            });

            let newIsTimeStopped = isTimeStopped;
            const timeStopAbility = newAbilities.find(a => a.id === 'timeStop');
            if (isTimeStopped && timeStopAbility?.state !== 'active') {
                newIsTimeStopped = false;
                if (newChronoShards.length > 0) {
                    const targets = [...enemiesAfterAI, ...(newBossState ? [newBossState] : []), ...newMinions].filter(t => t.status === 'active');
                    newChronoShards.forEach((shard, i) => {
                        const target = targets.length > 0 ? targets[i % targets.length] : null;
                        createdProjectiles.push({ id: `shard-${now}-${i}`, ownerId: 'player', position: shard.position, angle: shard.angle, size: { width: 12, height: 24 }, isChronoShard: true, isHoming: true, targetId: target?.id, turnRate: 8, damage: CHRONO_SHARD_DAMAGE });
                    });
                    newChronoShards = [];
                    const cbIndex = newAbilities.findIndex(a => a.id === 'cyberBeam');
                    if (cbIndex > -1) {
                        newAbilities[cbIndex] = { ...newAbilities[cbIndex], state: 'cooldown', startTime: now };
                        this.controlSound(this.audioManager.beamActive, 'stop');
                    }
                }
            }
            
             if (this.gamePhase === 'pre-boss' && newPlayerState.score >= BOSS_SPAWN_SCORE) {
                this.gamePhase = 'boss';
                enemiesAfterAI = []; 
                newBossState = { id: 'boss-1', name: 'Goliath', position: { x: ARENA_WIDTH / 2, y: 120 }, angle: 180, patrolTarget: undefined, size: { width: BOSS_WIDTH, height: BOSS_HEIGHT }, health: BOSS_HEALTH, maxHealth: BOSS_HEALTH, turretAngle: 180, status: 'spawning', spawnTime: now, color: '#ef4444', attackState: { currentAttack: 'none', phase: 'idle', phaseStartTime: now } };
            }

            if (newBossState && !isTimeStopped) {
                const isStunned = newBossState.statusEffects?.some(e => e.type === 'stun' && now - e.startTime < e.duration) ?? false;
                if (isStunned) {
                    // Boss is stunned, do nothing
                } else {
                    if (newBossState.health / newBossState.maxHealth <= LAST_STAND_HEALTH_THRESHOLD && !newBossState.hasUsedLastStand) {
                        if (newBossState.attackState.currentAttack === 'laserSweep') this.controlSound(this.audioManager.bossLaserSweep, 'stop');
                        newBossState.hasUsedLastStand = true;
                        newBossState.attackState = { currentAttack: 'lastStand', phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: LAST_STAND_TELEGRAPH_DURATION } };
                        newTelegraphs = []; this.controlSound(this.audioManager.bossLastStandCharge, 'play');
                    }

                    if (newBossState.status === 'spawning' && now >= (newBossState.spawnTime || 0) + SPAWN_DURATION) { newBossState.status = 'active'; newBossState.attackState.phaseStartTime = now; }
                    if (newBossState.status === 'dying' && now >= (newBossState.deathTime || 0) + DEATH_DURATION * 2) {
                        if (this.gamePhase === 'boss') {
                            this.gamePhase = 'post-boss';
                            enemiesAfterAI = getInitialEnemies(now).map(e => ({...e, tier: 'intermediate', color: '#f97316'}));
                        }
                        newBossState = null;
                    }

                    if (newBossState && newBossState.status === 'active') {
                        const dx = newPlayerState.position.x - newBossState.position.x; const dy = newPlayerState.position.y - newBossState.position.y;
                        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; let currentAngle = newBossState.turretAngle;
                        let angleDiff = targetAngle - currentAngle; while (angleDiff < -180) angleDiff += 360; while (angleDiff > 180) angleDiff -= 360;
                        if (Math.abs(angleDiff) < BOSS_TURRET_TURN_SPEED) currentAngle = targetAngle; else currentAngle += Math.sign(angleDiff) * BOSS_TURRET_TURN_SPEED;
                        newBossState.turretAngle = (currentAngle % 360 + 360) % 360;
                        
                        const BOSS_PATROL_AREA = { x: 100, y: 80, width: ARENA_WIDTH - 200, height: 100 }; let newBossPatrolTarget = newBossState.patrolTarget;
                        const needsNewTarget = !newBossPatrolTarget || (Math.hypot(newBossState.position.x - newBossPatrolTarget.x, newBossState.position.y - newBossPatrolTarget.y) < 20);
                        if (needsNewTarget) { newBossPatrolTarget = { x: BOSS_PATROL_AREA.x + Math.random() * BOSS_PATROL_AREA.width, y: BOSS_PATROL_AREA.y + Math.random() * BOSS_PATROL_AREA.height, }; newBossState.patrolTarget = newBossPatrolTarget; }
                        
                        let targetForMovement = newBossPatrolTarget; let newPos = { ...newBossState.position }; let newBodyAngle = newBossState.angle || 180;
                        if (targetForMovement && newBossState.attackState.currentAttack !== 'lastStand') {
                            const tdx = targetForMovement.x - newBossState.position.x; const tdy = targetForMovement.y - newBossState.position.y; const dist = Math.hypot(tdx, tdy);
                            if (dist > BOSS_SPEED) {
                                const velX = (tdx / dist) * BOSS_SPEED; const velY = (tdy / dist) * BOSS_SPEED;
                                const potentialPos = { x: newPos.x + velX, y: newPos.y + velY };
                                const bossRect = { x: potentialPos.x - BOSS_WIDTH / 2, y: potentialPos.y - BOSS_HEIGHT / 2, width: BOSS_WIDTH, height: BOSS_HEIGHT };
                                if (!this.isCollidingWithEnvironment(bossRect, [newPlayerState])) newPos = potentialPos; else newBossState.patrolTarget = undefined; 
                                if (Math.hypot(newPos.x - newBossState.position.x, newPos.y - newBossState.position.y) > 0.1) newBodyAngle = Math.atan2(newPos.y - newBossState.position.y, newPos.x - newBossState.position.x) * (180 / Math.PI) + 90;
                            }
                        }
                        newBossState.position = newPos; newBossState.angle = newBodyAngle;
                        
                        const { phase, phaseStartTime, currentAttack, attackData } = newBossState.attackState;
                        if (phase === 'idle' && now >= phaseStartTime + BOSS_IDLE_TIME) {
                            const attacks: Boss['attackState']['currentAttack'][] = ['mortarVolley', 'laserSweep', 'multiLane', 'xPattern', 'summonMinions'];
                            const nextAttack = attacks[Math.floor(Math.random() * attacks.length)];
                            const attackOrigin = { ...newPlayerState.position };
                            if (nextAttack === 'summonMinions') {
                                const targets: Vector[] = [];
                                const angleSpread = 120; const distance = BOSS_WIDTH * 0.7;
                                const baseAngle = (newBossState.angle || 180) - 90;
                                for (let i = 0; i < MINION_SUMMON_COUNT; i++) {
                                    const angle = baseAngle - (angleSpread / 2) + (i * (angleSpread / (MINION_SUMMON_COUNT - 1)));
                                    const rad = angle * (Math.PI / 180);
                                    targets.push({ x: newBossState.position.x + Math.cos(rad) * distance, y: newBossState.position.y + Math.sin(rad) * distance });
                                }
                                newBossState.attackState = { currentAttack: 'summonMinions', phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: MINION_SUMMON_TELEGRAPH, targets } };
                            } else if (nextAttack === 'mortarVolley') {
                                const targets: Vector[] = []; for (let i = 0; i < MORTAR_STRIKE_COUNT; i++) targets.push({ x: attackOrigin.x + (Math.random() - 0.5) * 200, y: attackOrigin.y + (Math.random() - 0.5) * 200 });
                                newBossState.attackState = { currentAttack: 'mortarVolley', phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: MORTAR_TELEGRAPH_DURATION, attackDuration: MORTAR_ATTACK_DURATION, targets } };
                            } else if (nextAttack === 'laserSweep') {
                                const sweepAngleStart = newBossState.turretAngle;
                                newBossState.attackState = { currentAttack: 'laserSweep', phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: LASER_TELEGRAPH_DURATION, attackDuration: LASER_ATTACK_DURATION, sweepAngleStart } };
                            } else if (nextAttack === 'multiLane') { const attackAngle = newBossState.turretAngle; newBossState.attackState = { currentAttack: 'multiLane', phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: MULTI_LANE_TELEGRAPH, attackDuration: MULTI_LANE_ATTACK_DURATION, attackOrigin, attackAngle } }; }
                            else if (nextAttack === 'xPattern') { newBossState.attackState = { currentAttack: 'xPattern', phase: 'telegraphing', phaseStartTime: now, attackData: { telegraphDuration: XPATT_TELEGRAPH, attackDuration: XPATT_ATTACK_DURATION, attackOrigin } }; }
                        } else if (phase === 'telegraphing') {
                            newTelegraphs = [];
                            if (currentAttack === 'lastStand') {
                                newTelegraphs.push({ id: 'lastStand-tele', type: 'circle', position: newBossState.position, radius: LAST_STAND_RADIUS, createdAt: phaseStartTime, duration: LAST_STAND_TELEGRAPH_DURATION });
                                const chargeProgress = (now - phaseStartTime) / LAST_STAND_TELEGRAPH_DURATION;
                                const shakeIntensity = 5 + 25 * (chargeProgress * chargeProgress);
                                this.triggerShake(shakeIntensity, 100);
                            } else if (currentAttack === 'summonMinions' && attackData?.targets) {
                                attackData.targets.forEach((t, i) => newTelegraphs.push({ id: `mtele-${i}`, type: 'circle', position: t, radius: MINION_SIZE.width / 2, createdAt: phaseStartTime, duration: MINION_SUMMON_TELEGRAPH }));
                            } else if (currentAttack === 'mortarVolley' && attackData?.targets) {
                                attackData.targets.forEach((t, i) => newTelegraphs.push({ id: `mtele-${i}`, type: 'circle', position: t, radius: MORTAR_RADIUS, createdAt: phaseStartTime, duration: MORTAR_TELEGRAPH_DURATION }));
                            } else if (currentAttack === 'multiLane' && attackData?.attackOrigin && attackData.attackAngle !== undefined) {
                                const { attackOrigin, attackAngle } = attackData; const laneWidth = 80; const laneHeight = ARENA_HEIGHT; const laneSpacing = 150;
                                const perpAngleRad = (attackAngle - 90 + 90) * Math.PI / 180; const offsetX = laneSpacing * Math.cos(perpAngleRad); const offsetY = laneSpacing * Math.sin(perpAngleRad);
                                const lanes = [ { position: { x: attackOrigin.x - offsetX, y: attackOrigin.y - offsetY }, width: laneWidth, height: laneHeight, angle: attackAngle - 90}, { position: attackOrigin, width: laneWidth, height: laneHeight, angle: attackAngle - 90 }, { position: { x: attackOrigin.x + offsetX, y: attackOrigin.y + offsetY }, width: laneWidth, height: laneHeight, angle: attackAngle - 90 }, ];
                                lanes.forEach((lane, i) => newTelegraphs.push({ id: `lane-${i}`, type: 'rect', ...lane, createdAt: phaseStartTime, duration: attackData.telegraphDuration || 2000}));
                            } else if (currentAttack === 'xPattern' && attackData?.attackOrigin) {
                                const { attackOrigin } = attackData; const laneWidth = 60; const laneHeight = ARENA_WIDTH * 1.2;
                                const lanes = [ { position: attackOrigin, width: laneWidth, height: laneHeight, angle: 45 }, { position: attackOrigin, width: laneWidth, height: laneHeight, angle: -45 }, ];
                                lanes.forEach((lane, i) => newTelegraphs.push({ id: `lane-${i}`, type: 'rect', ...lane, createdAt: phaseStartTime, duration: attackData.telegraphDuration || 2000}));
                            }
                            if (now >= phaseStartTime + (attackData?.telegraphDuration || 0)) {
                                newBossState.attackState.phase = 'attacking'; newBossState.attackState.phaseStartTime = now;
                                if (currentAttack === 'summonMinions' && attackData?.targets) {
                                    attackData.targets.forEach((pos, i) => { newMinions.push(getInitialMinionState(`minion-${now}-${i}`, pos, now)); });
                                    newBossState.attackState = { currentAttack: 'none', phase: 'idle', phaseStartTime: now };
                                } else if (currentAttack === 'lastStand') {
                                    this.controlSound(this.audioManager.bossLastStandCharge, 'stop');
                                    this.playSound(this.audioManager.bossLastStandExplosion);
                                    newAnimations.push({ id: `final-blast-${now}`, type: 'finalBlast', createdAt: now, duration: LAST_STAND_ATTACK_DURATION, position: newBossState.position, color: newBossState.color, width: LAST_STAND_RADIUS * 2, height: LAST_STAND_RADIUS * 2 });
                                    this.triggerShake(50, 800);
                                } else if (currentAttack === 'multiLane' && attackData?.attackOrigin && attackData.attackAngle !== undefined) {
                                    const { attackOrigin, attackAngle } = attackData; const laneWidth = 80; const laneHeight = ARENA_HEIGHT; const laneSpacing = 150;
                                    const perpAngleRad = (attackAngle - 90 + 90) * Math.PI / 180; const offsetX = laneSpacing * Math.cos(perpAngleRad); const offsetY = laneSpacing * Math.sin(perpAngleRad);
                                    const lanes = [ { position: { x: attackOrigin.x - offsetX, y: attackOrigin.y - offsetY }, width: laneWidth, height: laneHeight, angle: attackAngle - 90}, { position: attackOrigin, width: laneWidth, height: laneHeight, angle: attackAngle - 90 }, { position: { x: attackOrigin.x + offsetX, y: attackOrigin.y + offsetY }, width: laneWidth, height: laneHeight, angle: attackAngle - 90 }, ];
                                    lanes.forEach((lane, i) => newAnimations.push({ id: `lane-attack-${i}-${now}`, type: 'laneAttack', createdAt: now, duration: 400, position: lane.position, width: lane.width, height: lane.height, angle: lane.angle, color: newBossState.color }));
                                } else if (currentAttack === 'xPattern' && attackData?.attackOrigin) {
                                    const { attackOrigin } = attackData; const laneWidth = 60; const laneHeight = ARENA_WIDTH * 1.2;
                                    const lanes = [ { position: attackOrigin, width: laneWidth, height: laneHeight, angle: 45 }, { position: attackOrigin, width: laneWidth, height: laneHeight, angle: -45 }, ];
                                    lanes.forEach((lane, i) => newAnimations.push({ id: `x-attack-${i}-${now}`, type: 'laneAttack', createdAt: now, duration: 400, position: lane.position, width: lane.width, height: lane.height, angle: lane.angle, color: newBossState.color }));
                                }
                                newTelegraphs = [];
                                if(currentAttack === 'mortarVolley') this.playSound(this.audioManager.bossMortar); if(currentAttack === 'laserSweep') this.controlSound(this.audioManager.bossLaserSweep, 'play');
                                if(currentAttack === 'multiLane') this.playSound(this.audioManager.bossMultiLane); if(currentAttack === 'xPattern') this.playSound(this.audioManager.bossXPattern);
                            }
                        } else if (phase === 'attacking') {
                            if (currentAttack === 'lastStand') {
                                if (now - phaseStartTime < 100) {
                                    const distToPlayer = Math.hypot(newPlayerState.position.x - newBossState.position.x, newPlayerState.position.y - newBossState.position.y);
                                    if (distToPlayer <= LAST_STAND_RADIUS) {
                                        newPlayerState.health = 0; newPlayerState.status = 'dying'; newPlayerState.deathTime = now;
                                        newAnimations.push({ id: `exp-${newPlayerState.id}-${now}`, type: 'explosion', createdAt: now, duration: DEATH_DURATION, position: newPlayerState.position, color: newPlayerState.color });
                                    }
                                }
                                if (now >= phaseStartTime + LAST_STAND_ATTACK_DURATION) { newBossState.health = 0; }
                            } else if (currentAttack === 'mortarVolley' && attackData?.targets) {
                                if(now - phaseStartTime < (attackData.attackDuration || 500)) attackData.targets.forEach((target, i) => { newAnimations.push({ id: `mortar-impact-${i}-${now}`, type: 'mortarStrike', createdAt: now, duration: 700, position: target, color: '#ef4444' }); if (Math.hypot(newPlayerState.position.x - target.x, newPlayerState.position.y - target.y) <= MORTAR_RADIUS) { newPlayerState.health -= MORTAR_DAMAGE; newPlayerState.lastHitTime = now; this.triggerShake(10, 300); newDamageNumbers.push({id: `dn-mortar-${now}`, text: MORTAR_DAMAGE.toFixed(1), position: {...newPlayerState.position}, createdAt: now, duration: 1000, color: '#E0E5F0'}); newDamageIndicators.push({id:`di-mortar-${i}-${now}`, angle: Math.atan2(target.y - newPlayerState.position.y, target.x - newPlayerState.position.y)*(180/Math.PI), createdAt: now, duration: 1500});} });
                                if (now >= phaseStartTime + (attackData.attackDuration || 500)) newBossState.attackState = { currentAttack: 'none', phase: 'idle', phaseStartTime: now };
                            } else if (currentAttack === 'laserSweep' && attackData?.attackDuration) {
                                const sweepProgress = (now - phaseStartTime) / attackData.attackDuration; const sweepArc = 90; const currentAngleOffset = (sweepProgress * sweepArc) - (sweepArc / 2); const laserAngle = (attackData.sweepAngleStart || 0) + currentAngleOffset;
                                const playerDist = Math.hypot(newPlayerState.position.x - newBossState.position.x, newPlayerState.position.y - newBossState.position.y); const angleToPlayer = Math.atan2(newPlayerState.position.y - newBossState.position.y, newPlayerState.position.x - newBossState.position.x) * (180 / Math.PI) + 90;
                                const angleDiff = Math.abs((((laserAngle - angleToPlayer) % 360) + 540) % 360 - 180);
                                if (playerDist < LASER_WIDTH && angleDiff < 5 && now - this.lastLaserDamageTime > LASER_DAMAGE_TICK_INTERVAL) { this.lastLaserDamageTime = now; newPlayerState.health -= LASER_DAMAGE_PER_TICK; newPlayerState.lastHitTime = now; newDamageNumbers.push({id: `dn-laser-${now}`, text: LASER_DAMAGE_PER_TICK.toFixed(2), position: {...newPlayerState.position}, createdAt: now, duration: 800, color: '#E0E5F0'}); newDamageIndicators.push({id:`di-laser-${now}`, angle: Math.atan2(newBossState.position.y - newPlayerState.position.y, newBossState.position.x - newPlayerState.position.x)*(180/Math.PI), createdAt: now, duration: 1500}); }
                                if (now >= phaseStartTime + attackData.attackDuration) { newBossState.attackState = { currentAttack: 'none', phase: 'idle', phaseStartTime: now }; this.controlSound(this.audioManager.bossLaserSweep, 'stop'); }
                            } else if (currentAttack === 'multiLane' || currentAttack === 'xPattern') {
                                let lanes: { position: Vector; width: number; height: number; angle: number }[] = [];
                                if (currentAttack === 'multiLane' && attackData?.attackOrigin && attackData.attackAngle !== undefined) {
                                    const { attackOrigin, attackAngle } = attackData; const laneWidth = 80; const laneHeight = ARENA_HEIGHT; const laneSpacing = 150;
                                    const perpAngleRad = (attackAngle - 90 + 90) * Math.PI / 180; const offsetX = laneSpacing * Math.cos(perpAngleRad); const offsetY = laneSpacing * Math.sin(perpAngleRad);
                                    lanes = [ { position: { x: attackOrigin.x - offsetX, y: attackOrigin.y - offsetY }, width: laneWidth, height: laneHeight, angle: attackAngle - 90}, { position: attackOrigin, width: laneWidth, height: laneHeight, angle: attackAngle - 90 }, { position: { x: attackOrigin.x + offsetX, y: attackOrigin.y + offsetY }, width: laneWidth, height: laneHeight, angle: attackAngle - 90 }, ];
                                } else if (currentAttack === 'xPattern' && attackData?.attackOrigin) {
                                    const { attackOrigin } = attackData; const laneWidth = 60; const laneHeight = ARENA_WIDTH * 1.2;
                                    lanes = [ { position: attackOrigin, width: laneWidth, height: laneHeight, angle: 45 }, { position: attackOrigin, width: laneWidth, height: laneHeight, angle: -45 }, ];
                                }
                                if (now - phaseStartTime < (attackData.attackDuration || 500) && lanes.length > 0) {
                                    const playerCorners = [ { x: playerRect.x, y: playerRect.y }, { x: playerRect.x + TANK_WIDTH, y: playerRect.y }, { x: playerRect.x, y: playerRect.y + TANK_HEIGHT }, { x: playerRect.x + TANK_WIDTH, y: playerRect.y + TANK_HEIGHT } ];
                                    let playerHit = false;
                                    for (const lane of lanes) {
                                        const angleRad = -(lane.angle * Math.PI / 180); const cos = Math.cos(angleRad); const sin = Math.sin(angleRad);
                                        for (const corner of playerCorners) {
                                            const transX = corner.x - lane.position.x; const transY = corner.y - lane.position.y; const rotX = transX * cos - transY * sin; const rotY = transX * sin + transY * cos;
                                            if (rotX > -lane.width / 2 && rotX < lane.width / 2 && rotY > -lane.height / 2 && rotY < lane.height / 2) { playerHit = true; break; }
                                        } if(playerHit) break;
                                    }
                                    if(playerHit) { const damage = currentAttack === 'multiLane' ? MULTI_LANE_DAMAGE : XPATT_DAMAGE; newPlayerState.health -= damage; newPlayerState.lastHitTime = now; this.triggerShake(12, 300); newDamageNumbers.push({id: `dn-lane-${now}`, text: damage.toFixed(1), position: {...newPlayerState.position}, createdAt: now, duration: 1000, color: '#E0E5F0'}); newDamageIndicators.push({id:`di-lane-${now}`, angle: Math.atan2(newBossState.position.y - newPlayerState.position.y, newBossState.position.x - newPlayerState.position.x)*(180/Math.PI), createdAt: now, duration: 1500}); }
                                } if (now >= phaseStartTime + (attackData.attackDuration || 500)) { newBossState.attackState = { currentAttack: 'none', phase: 'idle', phaseStartTime: now }; }
                            }
                        }
                    }
                }
            }
            if (!isTimeStopped) {
                newMinions.forEach(minion => {
                    if (minion.status === 'spawning' && now >= minion.spawnTime + MINION_SPAWN_DURATION) {
                        minion.status = 'active';
                    }
                     const isStunned = minion.statusEffects?.some(e => e.type === 'stun' && now - e.startTime < e.duration) ?? false;
                    if (minion.status === 'active' && !isStunned) {
                        const dx = newPlayerState.position.x - minion.position.x;
                        const dy = newPlayerState.position.y - minion.position.y;
                        minion.angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                    }
                });
            }
            
            return { ...prev, player: newPlayerState, enemies: enemiesAfterAI, projectiles: updatedProjs, animations: newAnimations, powerUps: newPowerUps, abilities: newAbilities, barrageTarget: newBarrageTarget, barrageStrikeStartTime: newBarrageStrikeStartTime, lastBarrageImpactTime: newLastBarrageImpactTime, cyberBeamTarget: newCyberBeamTarget, boss: newBossState, telegraphs: newTelegraphs, effectZones: newEffectZones, minions: newMinions, masteryNotification: newMasteryNotification, isTimeStopped: newIsTimeStopped, damageNumbers: newDamageNumbers, damageIndicators: newDamageIndicators, chronoShards: newChronoShards };
        });
    }
}

const GameScreen: React.FC<{ navigateTo: (screen: Screen) => void }> = ({ navigateTo }) => {
    const { settings } = useSettings();
    const [gameState, setGameState] = useState<GameState>(getInitialGameState());
    const [shake, setShake] = useState({ x: 0, y: 0 });
    const [scaledSize, setScaledSize] = useState({ width: ARENA_WIDTH, height: ARENA_HEIGHT });
    
    const shakeData = useRef({ intensity: 0, duration: 0, startTime: 0 });
    const gameManagerRef = useRef<GameManager | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const isPausedRef = useRef(false);
    const animationFrameIdRef = useRef<number | null>(null);
    
    const audioManager = useRef<{
        barrageCharge?: HTMLAudioElement; beamCharge?: HTMLAudioElement; beamActive?: HTMLAudioElement; bossLaserSweep?: HTMLAudioElement; bossMortar?: HTMLAudioElement; bossMultiLane?: HTMLAudioElement; bossXPattern?: HTMLAudioElement; bossLastStandCharge?: HTMLAudioElement; bossLastStandExplosion?: HTMLAudioElement;
        pools: Record<string, HTMLAudioElement[]>; poolIndexes: Record<string, number>;
    }>({ pools: {}, poolIndexes: {} }).current;
    
    const triggerShake = useCallback((intensity: number, duration: number) => {
        if (!settings.screenShake) return;
        shakeData.current = { intensity, duration, startTime: Date.now() };
    }, [settings.screenShake]);

    const playPooledSound = useCallback((key: 'shot') => {
      if (!settings.sound) return;
      const am = audioManager;
      if (!am.pools[key] || am.pools[key].length === 0) return;
      const pool = am.pools[key];
      const index = am.poolIndexes[key];
      const audio = pool[index];
      audio.volume = settings.soundVolume;
      audio.currentTime = 0;
      audio.play().catch(e => console.error(`Error playing sound "${key}":`, e.message));
      am.poolIndexes[key] = (index + 1) % pool.length;
    }, [settings.sound, settings.soundVolume, audioManager]);

    const playSound = useCallback((audio: HTMLAudioElement | undefined) => {
      if (!settings.sound || !audio) return;
      audio.volume = settings.soundVolume;
      audio.currentTime = 0;
      audio.play().catch(e => console.error('Error playing sound:', e.message));
    }, [settings.sound, settings.soundVolume]);

    const controlSound = useCallback((audio: HTMLAudioElement | undefined, action: 'play' | 'stop') => {
      if (!settings.sound || !audio) return;

      // @ts-ignore - Using a custom property to track the timeout
      if (audio._cropTimeout) {
        // @ts-ignore
        clearTimeout(audio._cropTimeout);
        // @ts-ignore
        delete audio._cropTimeout;
      }

      if (action === 'play') {
          audio.volume = settings.soundVolume; audio.currentTime = 0;
          audio.play().catch(e => console.error('Error playing sound:', e.message));

          if (audio === audioManager.beamCharge) {
            // @ts-ignore
            audio._cropTimeout = setTimeout(() => {
              if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
              }
            }, CYBER_BEAM_CHARGE_TIME);
          } else if (audio === audioManager.bossLastStandCharge) {
             // @ts-ignore
            audio._cropTimeout = setTimeout(() => {
              if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
              }
            }, LAST_STAND_TELEGRAPH_DURATION);
          }
      } else { 
        audio.pause(); 
        audio.currentTime = 0; 
      }
    }, [settings.sound, settings.soundVolume, audioManager]);

    const difficultyParams = useMemo(() => {
        const base = {
            Easy: { enemySpeed: 0.5, detectionRadius: 250, fireRateModifier: 0.4, pathRecalcInterval: 4000, pathingTargetLagMs: 700, usePathSmoothing: false, tacticalReposition: false, aimingError: 5, firingHesitationMs: 500, powerUpPriority: 0.2, turretTurnSpeed: 1.0 },
            Medium: { enemySpeed: 0.75, detectionRadius: 350, fireRateModifier: 1, pathRecalcInterval: 2000, pathingTargetLagMs: 0, usePathSmoothing: true, tacticalReposition: false, aimingError: 2, firingHesitationMs: 100, powerUpPriority: 0.6, turretTurnSpeed: 2.0 },
            Hard: { enemySpeed: 0.95, detectionRadius: 500, fireRateModifier: 2.2, pathRecalcInterval: 800, pathingTargetLagMs: 0, usePathSmoothing: true, tacticalReposition: true, aimingError: 0, firingHesitationMs: 0, powerUpPriority: 1.0, turretTurnSpeed: 4.0 }
        };
        const intermediateMods = { speed: 1.1, fireRate: 1.2 };
        const selectedBase = base[settings.difficulty];
        return {
            ...selectedBase,
            intermediateEnemySpeed: selectedBase.enemySpeed * intermediateMods.speed,
            intermediateFireRateModifier: selectedBase.fireRateModifier * intermediateMods.fireRate,
        };
    }, [settings.difficulty]);

    useLayoutEffect(() => {
        const handleResize = () => {
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) return;
            
            const availableWidth = window.innerWidth;
            const availableHeight = window.innerHeight;
            
            const scaleX = availableWidth / (ARENA_WIDTH + 320 + 320); // Arena + 2 sidebars
            const scaleY = availableHeight / (ARENA_HEIGHT + 32); // Arena + padding
            const scale = Math.min(scaleX, scaleY, 1); // Cap scale at 1

            setScaledSize({
                width: ARENA_WIDTH * scale,
                height: ARENA_HEIGHT * scale,
            });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            isPausedRef.current = document.hidden;
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        const createAndLoad = (src: string, loop = false) => { const audio = new Audio(src); audio.preload = 'auto'; audio.loop = loop; return audio; };
        audioManager.barrageCharge = createAndLoad('https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/chargeup.mp3', true);
        audioManager.beamCharge = createAndLoad('https://github.com/23004277/weaponsassets/raw/refs/heads/main/recharge-47371.mp3', false);
        audioManager.beamActive = createAndLoad('https://github.com/23004277/weaponsassets/raw/refs/heads/main/laser-beam-76426.mp3', true);
        audioManager.bossLaserSweep = createAndLoad('https://github.com/23004277/weaponsassets/raw/refs/heads/main/laser-beam-76426.mp3', true);
        audioManager.bossMortar = createAndLoad('https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/upon%20contact.mp3');
        audioManager.bossMultiLane = createAndLoad('https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/laser-312360.mp3');
        audioManager.bossXPattern = createAndLoad('https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/beam-fire-282361.mp3');
        audioManager.bossLastStandCharge = createAndLoad('https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/chargeup.mp3');
        audioManager.bossLastStandExplosion = createAndLoad('https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/Explosion.ogg');
        
        const shotSources = [
            'https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/shoot-6-81136.mp3',
            'https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/shoot-5-102360.mp3',
            'https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/shoot-4-102361.mp3',
            'https://raw.githubusercontent.com/23004277/asteroid-clicker-assets/main/shoot-2-81137.mp3',
        ];
        const shotPool = Array.from({ length: 25 }, () => createAndLoad(shotSources[Math.floor(Math.random() * shotSources.length)]));
        audioManager.pools['shot'] = shotPool;
        audioManager.poolIndexes['shot'] = 0;
    }, [audioManager]);
    
    useEffect(() => {
        let animationFrameId: number;
        const updateShake = () => {
            const now = Date.now(); const { intensity, duration, startTime } = shakeData.current; const elapsed = now - startTime;
            if (elapsed < duration) {
                const progress = elapsed / duration; const currentIntensity = intensity * (1 - progress);
                setShake({ x: (Math.random() - 0.5) * currentIntensity, y: (Math.random() - 0.5) * currentIntensity });
                animationFrameId = requestAnimationFrame(updateShake);
            } else setShake({ x: 0, y: 0 });
        };
        if (shakeData.current.intensity > 0) animationFrameId = requestAnimationFrame(updateShake);
        return () => cancelAnimationFrame(animationFrameId);
    }, [shakeData.current.startTime]);
    
    useEffect(() => {
        const bgCanvas = document.createElement('canvas'); bgCanvas.width = ARENA_WIDTH; bgCanvas.height = ARENA_HEIGHT;
        const bgCtx = bgCanvas.getContext('2d');
        if (bgCtx) {
            bgCtx.fillStyle = '#0A0F1A'; bgCtx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
            drawGrid(bgCtx, ARENA_WIDTH, ARENA_HEIGHT, 30);
            initialWalls.forEach(wall => drawWall(bgCtx, wall));
            backgroundCanvasRef.current = bgCanvas;
        }
    }, []);

    useEffect(() => {
        const gm = new GameManager(settings, difficultyParams, audioManager, setGameState, triggerShake, playPooledSound, controlSound, playSound);
        gameManagerRef.current = gm;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleKeyDown = (e: KeyboardEvent) => gm.handleKeyDown(e.key.toLowerCase());
        const handleKeyUp = (e: KeyboardEvent) => gm.handleKeyUp(e.key.toLowerCase());
        const handleMouseMove = (e: MouseEvent) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (ARENA_WIDTH / rect.width);
            const y = (e.clientY - rect.top) * (ARENA_HEIGHT / rect.height);
            gm.handleMouseMove({ x, y });
        };
        const handleMouseDown = (e: MouseEvent) => { if (e.button === 0) gm.handleMouseDown(); };
        
        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', handleMouseMove); canvas.addEventListener('mousedown', handleMouseDown);
        
        const loop = () => { 
            if(!isPausedRef.current) {
              gm.update(); 
            }
            animationFrameIdRef.current = requestAnimationFrame(loop); 
        };
        loop();
        
        return () => {
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp);
            canvas.removeEventListener('mousemove', handleMouseMove); canvas.removeEventListener('mousedown', handleMouseDown);
        }
    }, [settings, difficultyParams, audioManager, triggerShake, playPooledSound, controlSound, playSound]);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
        const now = Date.now();
        const degToRad = (d: number) => d * (Math.PI / 180);
        
        ctx.save();
        if (gameState.isTimeStopped) {
            const timeStopAbility = gameState.abilities.find(a => a.id === 'timeStop');
            const duration = timeStopAbility?.duration || 1;
            const elapsed = now - (timeStopAbility?.startTime || 0);
            const fadeInProgress = Math.min(1, elapsed / 500); // 0.5s fade in
            const fadeOutProgress = Math.max(0, (elapsed - (duration - 500)) / 500); // 0.5s fade out
            const grayscale = Math.min(1, fadeInProgress - fadeOutProgress);
            ctx.filter = `grayscale(${grayscale * 100}%) brightness(${100 - grayscale * 20}%)`;
        }
        
        ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
        if (backgroundCanvasRef.current) ctx.drawImage(backgroundCanvasRef.current, 0, 0);
        
        drawTelegraphs(ctx, gameState.telegraphs, now);
        drawEffectZones(ctx, gameState.effectZones, now);

        if (gameState.isAiming === 'barrage') {
            const mousePos = gameManagerRef.current?.mousePosition || {x:0, y:0};
            const isChronoBoosted = gameState.effectZones.some(z => z.type === 'chrono' && Math.hypot(mousePos.x - z.position.x, mousePos.y - z.position.y) < z.radius);
            const radius = isChronoBoosted ? BARRAGE_RADIUS * 0.7 : BARRAGE_RADIUS;
            drawBarrageReticle(ctx, mousePos, radius, now);
        }

        if (gameState.isAiming === 'chronoBubble') drawChronoReticle(ctx, gameManagerRef.current?.mousePosition || {x:0,y:0}, CHRONO_BUBBLE_RADIUS, now);

        if (gameState.barrageTarget && gameState.barrageStrikeStartTime) {
            const warningProgress = Math.max(0, 1 - ((gameState.barrageStrikeStartTime - now) / BARRAGE_WARNING_DURATION));
            const radius = gameState.barrageTarget.isChronoBoosted ? BARRAGE_RADIUS * 0.7 : BARRAGE_RADIUS;
            if (warningProgress < 1) drawBarrageWarning(ctx, gameState.barrageTarget, radius, warningProgress, now);
        }

        gameState.powerUps.forEach(p => drawPowerUp(ctx, p, now));
        
        const playerAbilities = gameState.abilities;
        const toxicRoundsActive = gameState.abilities.find(a => a.id === 'toxicRounds')?.state === 'active';

        gameState.enemies.forEach(enemy => { if (enemy.status !== 'dying') drawTank(ctx, enemy, now, [], gameState.isTimeStopped); });
        gameState.minions.forEach(minion => { if (minion.status !== 'dying') drawMinion(ctx, minion, now); });
        if (gameState.player && gameState.player.status !== 'dying') drawTank(ctx, gameState.player, now, playerAbilities, false);
        if (gameState.boss && gameState.boss.status !== 'dying') drawBoss(ctx, gameState.boss, now, gameState.isTimeStopped);
        
        if (gameState.isTimeStopped && gameState.chronoShards.length > 0) {
            drawChronoShards(ctx, gameState.chronoShards, now);
        } else if (gameState.player && gameState.abilities.find(a => a.id === 'cyberBeam')?.state === 'active') {
             drawCyberBeam(ctx, gameState.player, gameState.cyberBeamTarget, now, toxicRoundsActive);
        }
        
        if (gameState.boss) {
            const { phase, phaseStartTime, attackData, currentAttack } = gameState.boss.attackState;
            if (currentAttack === 'laserSweep') {
                if (phase === 'telegraphing' && attackData?.sweepAngleStart) {
                    ctx.save(); ctx.translate(gameState.boss.position.x, gameState.boss.position.y);
                    const alpha = 0.3 + Math.sin(now / 100) * 0.1; ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
                    ctx.beginPath(); ctx.moveTo(0, 0); const startRad = degToRad(attackData.sweepAngleStart - 90 - 45); const endRad = degToRad(attackData.sweepAngleStart - 90 + 45); ctx.arc(0, 0, LASER_WIDTH, startRad, endRad); ctx.closePath(); ctx.fill(); ctx.restore();
                } else if (phase === 'attacking' && attackData?.attackDuration) {
                    const sweepProgress = (now - phaseStartTime) / attackData.attackDuration; const sweepArc = 90; const currentAngleOffset = (sweepProgress * sweepArc) - (sweepArc / 2); const laserAngle = (attackData.sweepAngleStart || 0) + currentAngleOffset;
                    ctx.save(); ctx.translate(gameState.boss.position.x, gameState.boss.position.y); ctx.rotate(degToRad(laserAngle - 90));
                    const gradient = ctx.createLinearGradient(0, -LASER_THICKNESS / 2, 0, LASER_THICKNESS / 2); gradient.addColorStop(0, 'rgba(239, 68, 68, 0)'); gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.8)'); gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
                    ctx.fillStyle = gradient; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 20; ctx.fillRect(0, -LASER_THICKNESS / 2, LASER_WIDTH, LASER_THICKNESS); ctx.restore();
                }
            }
        }
        
        gameState.projectiles.forEach(proj => { 
            const owner = [...gameState.enemies, gameState.player, ...gameState.minions].find(t => t && t.id === proj.ownerId); 
            drawProjectile(ctx, proj, owner as TankType, toxicRoundsActive);
        });
        drawAnimations(ctx, gameState.animations, now);

        // Last Stand screen tint overlay
        const boss = gameState.boss;
        if (boss && boss.attackState.currentAttack === 'lastStand' && boss.attackState.phase === 'telegraphing') {
            const chargeProgress = (now - boss.attackState.phaseStartTime) / (boss.attackState.attackData?.telegraphDuration || 6500);
            const easedProgress = chargeProgress * chargeProgress;
            ctx.fillStyle = `rgba(150, 20, 20, ${0.4 * easedProgress})`;
            ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
        }

        ctx.restore(); // Restore from filter
        if (gameState.isTimeStopped) {
            drawTimeStopOverlay(ctx, now);
        }
        
        drawDamageNumbers(ctx, gameState.damageNumbers, now);
        drawDamageIndicators(ctx, gameState.damageIndicators, gameState.player, now);

    }, [gameState]);

    const isCursorShooting = gameManagerRef.current?.keysPressed[' '] || gameState.abilities.find(a => a.id === 'cyberBeam')?.state === 'charging' || gameState.abilities.find(a => a.id === 'cyberBeam')?.state === 'active' || !!gameState.isAiming;
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
            <CustomCursor isShooting={!!isCursorShooting} />
            <div id="game-container" className="relative w-full flex items-center justify-center">
                <div className="w-80 flex-shrink-0" style={{ height: scaledSize.height }}>
                    <AbilityHotbar abilities={gameState.abilities} />
                </div>
                <div className="flex flex-col items-center mx-8">
                    <div className="relative bg-black/50 overflow-hidden box-glow-cyan cursor-none transition-transform duration-75 border-2 border-[var(--color-border-glow)]" style={{ width: scaledSize.width, height: scaledSize.height, transform: `translateX(${shake.x}px) translateY(${shake.y}px)` }}>
                        {gameState.masteryNotification && (Date.now() - gameState.masteryNotification.startTime < 4000) && (
                            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none mastery-notification">
                                <h2 className="font-orbitron text-4xl font-black uppercase text-amber-300 text-glow-amber tracking-widest">
                                    {gameState.masteryNotification.text}
                                </h2>
                            </div>
                        )}
                        <HUD enemiesRemaining={gameState.enemies.filter(e => e.status === 'active' || e.status === 'spawning').length + gameState.minions.filter(m => m.status === 'active' || m.status === 'spawning').length} />
                        {gameState.boss && <BossHealthBar boss={gameState.boss} />}
                        <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} style={{width: '100%', height: '100%'}}/>
                    </div>
                </div>
                <div className="w-80 flex-shrink-0 flex flex-col items-end" style={{ height: scaledSize.height }}>
                     <div className='pt-4 pr-4'>
                        <button onClick={() => navigateTo('settings')} aria-label="Open settings" className="group relative h-10 px-5 mb-4 bg-black/60 border-2 border-[var(--color-border)] rounded-full flex items-center justify-center transition-all duration-300 hover:border-cyan-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm">
                            <SettingsIcon className="w-6 h-6 text-cyan-400 transition-transform duration-500 group-hover:rotate-90" />
                        </button>
                    </div>
                    {gameState.player && <Leaderboard player={gameState.player} enemies={gameState.enemies} />}
                </div>
            </div>
            <style>{`
                @keyframes mastery-fade-in-out {
                    0% { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
                    15% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                    85% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -20px) scale(0.95); }
                }
                .mastery-notification {
                    animation: mastery-fade-in-out 4s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default GameScreen;

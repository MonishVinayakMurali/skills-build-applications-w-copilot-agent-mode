import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Activity input is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const body = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = body;

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('A valid userId is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    const error = new Error('A valid teamId is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (typeof type !== 'string' || !type.trim()) {
    const error = new Error('Activity type is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    const error = new Error('Activity minutes must be a positive number');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const userExists = await User.exists({ _id: userId });
  const teamExists = await Team.exists({ _id: teamId });
  if (!userExists || !teamExists) {
    const error = new Error('The referenced user and team must exist');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Team input is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const body = input as Record<string, unknown>;
  const { name, mascot, members } = body;

  if (typeof name !== 'string' || !name.trim()) {
    const error = new Error('Team name is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    const error = new Error('Team mascot is required');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const memberIds = Array.isArray(members) ? members : [];
  for (const member of memberIds) {
    if (typeof member !== 'string' || !mongoose.Types.ObjectId.isValid(member)) {
      const error = new Error('Team members must be valid user ObjectIds');
      (error as Error & { status?: number }).status = 400;
      throw error;
    }
  }

  const validMembers = [...new Set(memberIds)]
    .map((member) => new mongoose.Types.ObjectId(member as string));

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: validMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const grouped = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const teams = await Team.find({ _id: { $in: grouped.map((entry) => entry._id) } }).lean();
  const teamMap = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return grouped.map((entry, index) => ({
    teamName: teamMap.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) {
    const error = new Error('User not found');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const candidateFocuses = new Set<string>();
  if (typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim()) {
    candidateFocuses.add(user.fitnessGoal.trim().toLowerCase());
  }
  if (recentActivity?.type) {
    candidateFocuses.add(recentActivity.type.trim().toLowerCase());
  }

  const workouts = await Workout.find({}).sort({ title: 1 }).lean();

  const matches = workouts.filter((workout) => {
    const focus = typeof workout.focus === 'string' ? workout.focus.trim().toLowerCase() : '';
    return candidateFocuses.has(focus);
  });

  const suggestions = matches.length > 0 ? matches : workouts;

  return suggestions.map((workout) => ({
    ...workout,
    reason: `Matches ${user.fitnessGoal || recentActivity?.type || 'recent activity'} and supports the user's current activity pattern.`,
  }));
}

export { User };

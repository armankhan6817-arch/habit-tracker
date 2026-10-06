"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(null);

  useEffect(() => {
    loadHabits();
    loadCompletions();
    restoreSession();
  }, []);

  async function loadHabits() {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .order("created_at", { ascending: false });
    console.log("habits and error here-", data, error);
    setHabits(data || []);
  }

  async function loadCompletions() {
    const { data, error } = await supabase.from("completions").select("*");
    console.log("completions and error here-", data, error);
    setCompletions(data || []);
  }

  async function restoreSession() {
    const { data, error } = await supabase.auth.getSession();
    console.log("data and error-", data, error);
    setSession(data.session);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setHabits([]);
    setCompletions([]);
    console.log("logout error here-", error);
  }

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    setSession(data.session);
    loadHabits();
    loadCompletions();
    console.log("login data and error here-", data, error);
  }

  async function createHabit() {
    const { error } = await supabase.from("habits").insert([{ name: name }]);
    console.log("create habit error here-", error);
    loadHabits();
    setName("");
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getTodayDate() {
    return formatDate(new Date());
  }

  function isDoneOn(habit, thisDay) {
    const day = formatDate(thisDay);
    return completions.some(
      (completion) =>
        completion.habit_id === habit.id && completion.done_on === day,
    );
  }

  function isDoneToday(habit) {
    return isDoneOn(habit, new Date());
  }

  function getStreak(habit) {
    const day = new Date();
    if (!isDoneOn(habit, day)) {
      day.setDate(day.getDate() - 1);
    }
    let count = 0;
    while (isDoneOn(habit, day)) {
      count = count + 1;
      day.setDate(day.getDate() - 1);
    }
    return count;
  }

  async function markDone(habit) {
    const { error } = await supabase
      .from("completions")
      .insert([{ habit_id: habit.id, done_on: getTodayDate() }]);
    console.log("toggle habit error here-", error);
    loadCompletions();
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 py-16 px-4 bg-slate-50">
      {!session && (
        <div className="space-y-4 w-full max-w-sm">
          {/* Textbar 1: Login ID */}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            placeholder="Login ID or Email"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-black placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white/[0.08] focus:ring-4 focus:ring-indigo-500/20"
          />

          {/* Textbar 2: Password */}
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-black placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white/[0.08] focus:ring-4 focus:ring-indigo-500/20"
          />

          {/* 1 Button */}
          <button
            type="button"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/40 active:scale-[0.98]"
            onClick={login}
          >
            Sign In
          </button>
        </div>
      )}
      <p className="text-slate-900">{session ? "logged in" : "logged out"}</p>

      <ul className="flex flex-col w-full max-w-2xl gap-4">
        {habits.map((habit) => (
          <li
            key={habit.id}
            className="p-5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 text-lg transition-all hover:shadow-md flex items-center gap-3"
          >
            <input
              type="checkbox"
              checked={isDoneToday(habit)}
              onChange={() => markDone(habit)}
              disabled={!session || isDoneToday(habit)}
              className="h-5 w-5 accent-blue-600"
            />
            <span
              className={
                isDoneToday(habit) ? "line-through text-slate-400" : ""
              }
            >
              {habit.name}
            </span>
            <span>🔥 {getStreak(habit)}</span>
          </li>
        ))}
      </ul>

      {session && (
        <div className="flex flex-col w-full max-w-2xl gap-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            My Habits
          </h1>
          <input
            placeholder="New habit..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-2xl p-4 text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
          />

          <button
            disabled={name.trim() === ""}
            onClick={createHabit}
            className="w-full max-w-2xl px-6 py-3 text-white font-semibold bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
          >
            Add Habit
          </button>
          <button
            onClick={logout}
            className="w-full max-w-2xl px-6 py-3 text-white font-semibold bg-red-600 rounded-xl shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

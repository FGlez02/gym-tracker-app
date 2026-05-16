async function fetchGroups() {
    const response = await fetch(`${API_URL}?action=getGroups`);
    return await response.json();
}

async function fetchExercisesByGroup(group) {
    const response = await fetch(
        `${API_URL}?action=getExercisesByGroup&group=${encodeURIComponent(group)}`
    );
    return await response.json();
}

async function fetchLastExercise(exercise) {
    const response = await fetch(
        `${API_URL}?action=getLastExercise&exercise=${encodeURIComponent(exercise)}`
    );
    return await response.json();
}

async function fetchTodayWorkout() {
    const response = await fetch(`${API_URL}?action=getTodayWorkout`);
    return await response.json();
}

async function saveWorkout(payload) {
    const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    return await response.json();
}
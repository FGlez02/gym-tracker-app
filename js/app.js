const groupSelect = document.getElementById('group');
const exerciseSelect = document.getElementById('exercise');

const lastSessionCard = document.querySelector('.last-session-card');
const lastExerciseTitle = document.querySelector('.last-session-card h3');
const lastExerciseDate = document.querySelector('.last-session-card .last-date');
const lastSetsContainer = document.querySelector('.last-sets');

document.addEventListener('DOMContentLoaded', async () => {
    resetExerciseSelect();
    resetLastSession();
    await loadGroups();
});

async function loadGroups() {
    try {
        const data = await fetchGroups();

        console.log('Grupos recibidos:', data);

        groupSelect.innerHTML = '<option value="">Elegir grupo</option>';

        data.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando grupos:', error);
    }
}

groupSelect.addEventListener('change', async () => {
    const selectedGroup = groupSelect.value;

    resetLastSession();

    if (!selectedGroup) {
        resetExerciseSelect();
        return;
    }

    exerciseSelect.innerHTML = '<option value="">Cargando ejercicios...</option>';
    exerciseSelect.disabled = true;

    try {
        const data = await fetchExercisesByGroup(selectedGroup);

        console.log('Ejercicios recibidos:', data);

        exerciseSelect.innerHTML = '<option value="">Elegir ejercicio</option>';

        data.exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
            exerciseSelect.appendChild(option);
        });

        exerciseSelect.disabled = false;

    } catch (error) {
        console.error('Error cargando ejercicios:', error);
        resetExerciseSelect();
    }
});

exerciseSelect.addEventListener('change', async () => {
    const selectedExercise = exerciseSelect.value;

    resetLastSession();

    if (!selectedExercise) return;

    lastExerciseTitle.textContent = 'Cargando...';

    try {
        const data = await fetchLastExercise(selectedExercise);

        console.log('Ultima sesion recibida:', data);

        if (!data.found) {
            lastExerciseTitle.textContent = 'Sin registros previos';
            lastExerciseDate.textContent = '';
            lastSetsContainer.innerHTML = '<p>Todavia no hay datos para este ejercicio.</p>';
            return;
        }

        lastExerciseTitle.textContent = data.exercise;
        lastExerciseDate.textContent = formatDate(data.fecha);

        lastSetsContainer.innerHTML = '';

        data.series.forEach(set => {
            const p = document.createElement('p');
            p.innerHTML = `Serie ${set.serie} · <strong>${set.peso} kg x ${set.reps}</strong>`;
            lastSetsContainer.appendChild(p);
        });

    } catch (error) {
        console.error('Error cargando ultima sesion:', error);
        lastExerciseTitle.textContent = 'Error al cargar';
        lastExerciseDate.textContent = '';
        lastSetsContainer.innerHTML = '<p>No se pudo cargar la ultima sesion.</p>';
    }
});

function resetExerciseSelect() {
    exerciseSelect.innerHTML = '<option value="">Primero elige grupo</option>';
    exerciseSelect.disabled = true;
}

function resetLastSession() {
    lastExerciseTitle.textContent = 'Selecciona un ejercicio';
    lastExerciseDate.textContent = '';
    lastSetsContainer.innerHTML = '<p>Aqui aparecera lo que hiciste la ultima vez.</p>';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}
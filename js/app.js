// js/app.js

const groupSelect = document.getElementById('group');
const exerciseSelect = document.getElementById('exercise');

const lastSessionCard = document.querySelector('.last-session-card');

const lastExerciseTitle = document.querySelector('.last-session-card h3');
const lastExerciseDate = document.querySelector('.last-session-card span');
const lastSetsContainer = document.querySelector('.last-sets');

document.addEventListener('DOMContentLoaded', async () => {

    await loadGroups();

});

async function loadGroups() {

    try {

        const data = await fetchGroups();

        groupSelect.innerHTML = `
            <option value="">Elegir grupo</option>
        `;

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

    exerciseSelect.innerHTML = `
        <option value="">Cargando...</option>
    `;

    try {

        const data = await fetchExercisesByGroup(selectedGroup);

        exerciseSelect.innerHTML = `
            <option value="">Elegir ejercicio</option>
        `;

        data.exercises.forEach(exercise => {

            const option = document.createElement('option');

            option.value = exercise;
            option.textContent = exercise;

            exerciseSelect.appendChild(option);

        });

    } catch (error) {

        console.error('Error cargando ejercicios:', error);

    }
});

exerciseSelect.addEventListener('change', async () => {

    const selectedExercise = exerciseSelect.value;

    if (!selectedExercise) return;

    try {

        const data = await fetchLastExercise(selectedExercise);

        if (!data.found) {

            lastExerciseTitle.textContent = 'Sin registros';
            lastExerciseDate.textContent = '';
            lastSetsContainer.innerHTML = '';

            return;
        }

        lastExerciseTitle.textContent = data.exercise;

        const formattedDate = formatDate(data.fecha);

        lastExerciseDate.textContent = formattedDate;

        lastSetsContainer.innerHTML = '';

        data.series.forEach(set => {

            const p = document.createElement('p');

            p.innerHTML = `
                Serie ${set.serie} · 
                <strong>${set.peso} kg x ${set.reps}</strong>
            `;

            lastSetsContainer.appendChild(p);

        });

    } catch (error) {

        console.error('Error cargando ultima sesion:', error);

    }
});

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString('es-ES');

}
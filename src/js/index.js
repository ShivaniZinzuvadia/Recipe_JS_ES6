import Search from './Models/Search';
import Recipe from './Models/Recipe';
import List from './Models/List';
import Likes from './Models/Likes';
import * as searchView from './Views/searchView';
import * as recipeView from './Views/recipeView';
import * as listView from './Views/listView';
import * as likeViews from './Views/likesView';

import { elements, renderLoader, clearLoader } from './Views/base';

/** Global search object
 * - Search Object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes 
 */
const state = {};

/**
 * Search controller
 */
const ControlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput();

    if (query) {
        // 2) New state object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
            // 4) Search for recipes
            await state.search.getResults();
    
            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }
        catch(error) {
            alert("Something went wrong with Search!");
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    ControlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
 * Recipe controller
 */

const ControlRecipe = async () => {
    //  Get ID from URL
    const id = window.location.hash.replace('#', '');
    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
        if (state.search) searchView.highlightSelected(id);

        // Create recipe object
        state.recipe = new Recipe(id);

        try {
            // Get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render recipe            
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        }
        catch(error) {
             alert("Error processing recipe");
        }
        
    }
}

['hashchange','load'].forEach(event => window.addEventListener(event, ControlRecipe));


/** 
 * LIST CONTROLLER
 */
const controlList = () => {
    // Create a new list IF there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

    // Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


/** 
 * LIKE CONTROLLER
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Toggle the like button
        likeViews.toggleLikeBtn(true);
       
        // Add like to UI list
        likeViews.renderLike(newLike);

    // User HAS liked current recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likeViews.toggleLikeBtn(false);

        // Remove like from UI list
        likeViews.deleteLike(currentID);
    }
    likeViews.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likeViews.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likeViews.renderLike(like));
});


elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if(e.target.matches('.btn-increase, .btn-increase *')) {
        state.recipe.updateServings('inc');  
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
})
from django.urls import path

from .views import RegionDistrictListView, RegionListView


urlpatterns = [
    path("regions/", RegionListView.as_view(), name="locations-regions"),
    path("regions/<uuid:pk>/districts/", RegionDistrictListView.as_view(), name="locations-region-districts"),
]

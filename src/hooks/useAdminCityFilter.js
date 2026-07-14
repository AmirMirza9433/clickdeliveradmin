import { useEffect, useMemo, useState } from "react";
import { adminService } from "../services/adminService";
import { getCityFilterParams } from "../components/AdminDateFilter";
import { useAuth } from "../context/AuthContext";

export const useAdminCityFilter = () => {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState("all");
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const data = await adminService.getCities();
        setCities(data || []);
      } catch (error) {
        setCities([]);
      }
    };

    loadCities();
  }, []);

  const accessibleCities = useMemo(() => {
    if (!user || user.role === "admin") {
      return cities;
    }

    const allowed = user.accessibleCities || [];
    if (!allowed.length || allowed.includes("All")) {
      return cities;
    }

    return cities.filter((city) => allowed.includes(city.name));
  }, [cities, user]);

  useEffect(() => {
    if (
      user?.role === "sub-admin" &&
      selectedCity !== "all" &&
      !accessibleCities.some((city) => city.name === selectedCity)
    ) {
      setSelectedCity("all");
    }
  }, [accessibleCities, selectedCity, user?.role]);

  const cityParams = useMemo(
    () => getCityFilterParams(selectedCity),
    [selectedCity],
  );

  return {
    cities: accessibleCities,
    selectedCity,
    setSelectedCity,
    cityParams,
  };
};
